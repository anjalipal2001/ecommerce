import React, { useState, useEffect } from "react";
import "./Payment.css";
import { useStateValue } from "../StateProvider";
import { getCartTotal } from "../reducer";
import { Link, useHistory } from "react-router-dom";
import { motion } from "framer-motion";
import { errorAnim } from "../util";
import axios from "axios";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import db from "../firebase";
import successImg from "../assets/success.svg";

function Payment() {
  const stripe = useStripe();
  const stripeElements = useElements();
  const history = useHistory();

  const exchangeRateUrl =
    "https://api.exchangeratesapi.io/latest?symbols=INR&base=USD";
  const [{ user, cart, loadingBar }, dispatch] = useStateValue();
  const [orderId, setOrderId] = useState(null);
  const [succeeded, setSucceeded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cartTotal, setCartTotal] = useState(0);
  const [cartTotalWithTax, setCartTotalWithTax] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(false);
  const [method, setMethod] = useState("");

  const changeMethod = (e) => {
    if (e.target.checked) {
      setMethod(e.target.value);
    }
    if (e.target.checked && e.target.value === 'cod') {
      setError(null);
    }
  };

  useEffect(() => {
    if (user) {
      db.collection("users")
        .doc(user.uid)
        .get()
        .then((snapshot) => setUserDetails(snapshot.data()));
    }
  }, [user]);

  useEffect(() => {
    const calculateTotal = async () => {
      const totalAmount = await parseFloat(getCartTotal(cart));
      const withTax = totalAmount + totalAmount * 0.18;
      const totalAmountWithTax = parseFloat(withTax.toFixed(2));
      if (totalAmount < 25 && totalAmount > 0) {
        setCartTotalWithTax(totalAmountWithTax + 11.8);
        setCartTotal(totalAmount + 10.0);
        setDeliveryCharges(true);
      } else {
        setCartTotalWithTax(totalAmountWithTax);
        setCartTotal(totalAmount);
        setDeliveryCharges(false);
      }
    };
    calculateTotal();
  }, [cart]);

  useEffect(() => {
    if (cartTotalWithTax > 1) {
      const itemsDesc = cart.map((item) => `${item.name.replaceAll(' ','').substring(0,15)}_${item.quantity}`);
      axios.get(exchangeRateUrl).then((res) => {
        const toINRsubunits = cartTotalWithTax * res.data.rates.INR * 100;
        const amountINR = parseInt(toINRsubunits);
        axios
          .post(
            `https://amazon-ish.vercel.app/api/create-new-payment?total=${amountINR}&desc=${itemsDesc.toString()}`
          )
          .then((response) => {
            setClientSecret(response.data.clientSecret);
            setOrderId(response.data.id);
          }).catch((error) => {
            setError('Some error occurred. Try again later.');
            setOrderId('Error');
          });
      });
    }
  }, [cartTotalWithTax]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    loadingBar.current.continuousStart();
    if (!stripe || !stripeElements || !userDetails) {
      return;
      loadingBar.current.complete();
    }
    if (method === "card") {
      stripeElements.getElement(CardElement).update({ disabled: true });
      const result = await stripe
        .confirmCardPayment(clientSecret, {
          payment_method: {
            card: stripeElements.getElement(CardElement),
            billing_details: {
              name: cardHolder,
              phone: userDetails.phone,
              email: userDetails.email,
              address: {
                line1: userDetails.address,
                state: userDetails.state,
                country: userDetails.country,
                postal_code: userDetails.postal_code,
              },
            },
          },
          receipt_email: userDetails.email,
        })
        .then((response) => {
          if (response.error) {
            setError(response.error.message);
            setProcessing(false);
            stripeElements.getElement(CardElement).update({ disabled: false });
            loadingBar.current.complete();
          } else if (
            response.paymentIntent &&
            response.paymentIntent.status === "succeeded"
          ) {
            db.collection("users")
              .doc(user.uid)
              .collection("orders")
              .doc(response.paymentIntent.id)
              .set({
                created: response.paymentIntent.created,
                amount: cartTotalWithTax,
                items: cart,
                type: "card",
              })
              .then(() => {
                setSucceeded(true);
                setProcessing(false);
                setError(null);
                setDisabled(false);
                setTimeout(() => {
                  loadingBar.current.complete();
                  setShowSuccess(true);
                  dispatch({
                    type: "EMPTY_CART",
                  });
                }, 2000);
              });
          }
        });
    } else if (method === "cod") {
      db.collection("users")
        .doc(user.uid)
        .collection("orders")
        .add({
          created: (new Date() / 1000) | 0,
          amount: cartTotalWithTax,
          items: cart,
          type: "cod",
        })
        .then(() => {
          setSucceeded(true);
          setProcessing(false);
          setError(null);
          setDisabled(false);
          setTimeout(() => {
            loadingBar.current.complete();
            dispatch({
              type: "EMPTY_CART",
            });
            history.replace("/orders");
          }, 2000);
        });
    }
  };

  const handleCardChange = (e) => {
    setDisabled(e.empty);
    setError(e.error ? e.error.message : null);
  };

  return (
    <div className={`payment ${succeeded ? "payment__success" : ""}`}>
      <h4>Complete your Order, {user?.displayName.split(" ", 1)}!</h4>
      <div className="payment__inner">
        <div className="payment__method">
          <h5 style={{ marginTop: "2rem" }}>How'd you like to pay?</h5>
          <p style={{ marginBottom: "2rem", maxWidth: "400px" }}>
            Choose a payment method and verify your details to successfully
            place the order.
          </p>
          {method === "card" && (
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={errorAnim}
              className="payment__cardContainer"
            >
              <div className="payment__card">
                <input
                  disabled={processing || succeeded}
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  type="text"
                  placeholder="Name (as appears in card)"
                  className="payment__cardName"
                />
                <CardElement
                  onChange={handleCardChange}
                  options={{
                    style: {
                      base: {
                        fontSize: "20px",
                        fontWeight: "800",
                        fontFamily: "Nunito Sans, sans-serif",
                        iconColor: "#fff",
                        color: "#fff",
                        textShadow: "1px 1px 2px rgba(26,26,44,0.25)",
                        "::placeholder": {
                          color: "rgba(255,255,255,0.75)",
                          textShadow: "none",
                        },
                        ":-webkit-autofill": {
                          color: "#fff",
                        },
                      },
                      invalid: {
                        color: "#fee",
                        textShadow: "2px 2px 4px red",
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
          )}
          {error && (
            <motion.p
              initial="initial"
              animate="in"
              exit="out"
              variants={errorAnim}
              className="payment__cardError"
            >
              {error}
            </motion.p>
          )}
          <div className="form__element">
            <input
              disabled={processing || succeeded}
              name="method"
              id="card"
              value="card"
              type="radio"
              onChange={(e) => changeMethod(e)}
            />
            <label for="card">Add a Debit/Credit Card</label>
          </div>
          <div className="form__element">
            <input
              disabled={processing || succeeded}
              name="method"
              id="cod"
              value="cod"
              type="radio"
              onChange={(e) => changeMethod(e)}
            />
            <label for="cod">Cash on Delivery</label>
          </div>
          {userDetails && (
            <div className="payment__shippingDetails">
              <h5>Shipping Details</h5>
              <p>
                {userDetails.name}
                <br />
                {`${userDetails.address}, ${userDetails.state}, ${userDetails.country} - ${userDetails.postal_code}`}
                <br />
                {userDetails.phone}
                <br />
                {userDetails.email}
              </p>
            </div>
          )}
        </div>
        {!showSuccess ? (
          <div className="payment__summary">
            <h5>Order Summary</h5>
            <p>Order ID: {orderId ? orderId : "Generating..."}</p>
            <div className="payment__summaryList">
              {cart.map((item) => (
                <div className="payment__item">
                  <span className="payment__name">{item.name}</span>
                  <small className="payment__quantity">x{item.quantity}</small>
                  <span className="payment__price">
                    <small>$</small>
                    {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              {deliveryCharges && (
                <div className="payment__item">
                  <span className="payment__name">Delivery Charges</span>
                  <span className="payment__price">
                    <small>$</small>10.00
                  </span>
                </div>
              )}
              <hr />
              <div className="payment__item">
                <span className="payment__name">Total</span>
                <span className="payment__price">
                  <small>$</small>
                  {cartTotal}
                </span>
              </div>
              <div className="payment__item">
                <span className="payment__name">Tax</span>
                <small className="payment__quantity">(+18%)</small>
                <span className="payment__price">
                  <small>$</small>
                  {(cartTotal * 0.18).toFixed(2)}
                </span>
              </div>
              <div style={{ marginTop: "1.5rem" }} className="payment__item">
                <span className="payment__name">Grand Total</span>
                <span className="payment__price">
                  <strong style={{ fontSize: "1.25em", fontWeight: "900" }}>
                    <small>$</small>
                    {cartTotalWithTax}
                  </strong>
                </span>
              </div>
            </div>
            <div className="buttons">
              <button
                disabled={
                  !method ||
                  (method === "card" &&
                    (disabled || processing || !cardHolder || error))
                }
                onClick={(e) => handleSubmit(e)}
                className="buttonPrimary"
              >
                {processing
                  ? "Processing..."
                  : succeeded
                  ? "Success!"
                  : method === "cod"
                  ? "Confirm Order"
                  : "Pay Now"}
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={errorAnim}
            className="payment__summary"
          >
            <img src={successImg} />
            <h5>Yay, it's done!</h5>
            {orderId && <p>Order ID: {orderId}</p>}
            <p>
              Your payment has been successfully processed and we have received
              your order. Check your email for further details.
            </p>
            <div className="buttons">
              <Link to="/" replace>
                <button className="buttonPrimary">Go Home</button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Payment;
