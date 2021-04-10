import React, { useState, useEffect } from "react";
import "./Orders.css";
import { useStateValue } from "../StateProvider";
import { Link, useHistory } from "react-router-dom";
import db, { auth } from "../firebase";

function Orders() {
  const [{ loadingBar }] = useStateValue();
  const [orders, setOrders] = useState();
  const history = useHistory();

  useEffect(() => {
    if (loadingBar) {
      loadingBar.current.continuousStart();
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        db.collection("users")
          .doc(user.uid)
          .collection("orders")
          .orderBy("created", "desc")
          .get()
          .then((response) => {
            if (loadingBar) {
              loadingBar.current.complete();
            }
            setOrders(response.docs.map((doc) => doc.data()));
          });
        unsubscribe();
      } else {
        history.replace("/login?next=orders");
        if (loadingBar) {
          loadingBar.current.complete();
        }
      }
    });
  }, []);

  return (
    <div className="orders">
      <h4>Your Orders</h4>
      <div className="orders__inner">
        {orders?.map((order) => (
          <div className="payment__summary">
            <h5>Order ID: {order.created}</h5>
            <p>
              Payment Method: {order.type === "cod" && "COD"}
              {order.type === "card" && "Card"}
            </p>
            <div className="payment__summaryList">
              {order.items.map((item) => (
                <div className="payment__item">
                  <span className="payment__name">{item.name}</span>
                  <small className="payment__quantity">x{item.quantity}</small>
                  <span className="payment__price">
                    <small>$</small>
                    {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div style={{ marginBottom: "1.5rem" }}></div>
              <div
                style={{ marginTop: "auto" }}
                className="payment__item"
              >
                <span className="payment__name">Amount</span>
                <span className="payment__price">
                  <strong style={{ fontSize: "1.25em", fontWeight: "900" }}>
                    <small>$</small>
                    {order.amount}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;
