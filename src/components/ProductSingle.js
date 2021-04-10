import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ProductSingle.css";
import defaultImage from "../assets/default.jpg";
import TextTruncate from "react-text-truncate";
import Product from "./Product";
import LabelImportantRoundedIcon from "@material-ui/icons/LabelImportantRounded";
import AddShoppingCartRoundedIcon from "@material-ui/icons/AddShoppingCartRounded";
import ShoppingCartRoundedIcon from "@material-ui/icons/ShoppingCartRounded";
import BookmarkRoundedIcon from "@material-ui/icons/BookmarkRounded";
import ReactTooltip from "react-tooltip";
import { useStateValue } from "../StateProvider";
import db from "../firebase";

function ProductSingle() {
  const { id } = useParams();
  const [productDetails, setProductDetails] = useState({});
  const [features, setFeatures] = useState([]);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [{ cart, bookmarks, products, loadingBar }, dispatch] = useStateValue();

  useEffect(() => {
    if (loadingBar) {
      loadingBar.current.continuousStart();
    }
    db.collection("products")
      .doc(id)
      .get()
      .then((snapshot) => {
        setProductDetails(snapshot.data());
      })
      .then(() => {
        db.collection("products")
          .doc(id)
          .collection("features")
          .get()
          .then((snapshot) => {
            setFeatures(snapshot.docs[0].data().feature);
          });
      })
      .then(() => {
        if (loadingBar) {
          loadingBar.current.complete();
        }
      });
  }, [id]);

  const shuffleArray = (array) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const addToCart = (item) => {
    dispatch({
      type: "ADD_TO_CART",
      item: {
        name: productDetails.name,
        price: productDetails.price,
        originalPrice: productDetails.originalPrice,
        imgUrl: productDetails.imgUrl,
        discount: productDetails.discount,
        id: id,
        quantity: 1,
      },
    });
    console.log(cart);
  };

  const addToBookmarks = (item) => {
    dispatch({
      type: "ADD_TO_BOOKMARKS",
      item: {
        name: productDetails.name,
        price: productDetails.price,
        originalPrice: productDetails.originalPrice,
        imgUrl: productDetails.imgUrl,
        rating: 3.5,
        discount: productDetails.discount,
        id: id,
      },
    });
    console.log(cart);
  };

  useEffect(() => {
    setSuggestions(shuffleArray(products));
  }, [products]);

  useEffect(() => {
    const bIndex = bookmarks.findIndex((item) => item.id === id);
    if (bIndex >= 0) {
      setIsBookmarked(true);
    } else {
      setIsBookmarked(false);
    }

    const cIndex = cart.findIndex((item) => item.id === id);
    if (cIndex >= 0) {
      setIsAdded(true);
    } else {
      setIsAdded(false);
    }
  }, [bookmarks, cart, products, id]);

  return (
    <div className="productSingle">
      <div className="productSingle__inner">
        <div className="productSingle__image">
          <img src={productDetails ? productDetails.imgUrl : defaultImage} />
        </div>
        <div className="productSingle__details">
          <TextTruncate
            line={3}
            element="h5"
            containerClassName="productSingle__name"
            truncateText="…"
            text={productDetails?.name}
          />
          <ul className="productSingle__features">
            {features?.map((feature) => (
              <li>{feature}</li>
            ))}
          </ul>
          <span className="productSingle__footer">
            <p className="productSingle__price">
              <h4>${productDetails?.price}</h4>{" "}
              {productDetails?.discount && (
                <small>
                  <del>${productDetails?.originalPrice}</del>
                </small>
              )}
            </p>
            {productDetails.price > 25 && (
              <p className="productSingle__deliveryMessage">
                <LabelImportantRoundedIcon
                  style={{
                    fill: "transparent",
                    stroke: "currentColor",
                    strokeWidth: 1,
                    fontSize: 20,
                  }}
                />
                Free Delivery Available - Salem, India 636006
              </p>
            )}
            <div className="buttons">
              {isAdded ? (
                <button className="buttonPrimary">
                  <ShoppingCartRoundedIcon /> Added
                </button>
              ) : (
                <button className="buttonPrimary" onClick={addToCart}>
                  <AddShoppingCartRoundedIcon /> Add To Cart
                </button>
              )}
              <button
                data-tip={isBookmarked ? "Remove" : "Bookmark"}
                data-for="bookmarkTooltip"
                className="buttonSecondary"
                onClick={addToBookmarks}
              >
                <BookmarkRoundedIcon
                  style={{
                    fill: isBookmarked ? "#fff" : "transparent",
                    stroke: "#fff",
                    strokeWidth: 2,
                    fontSize: 20,
                  }}
                />
              </button>
              <ReactTooltip
                place="right"
                className="app__toolTip"
                id="bookmarkTooltip"
                backgroundColor="#1a1a2cee"
                effect="solid"
              />
            </div>
          </span>
        </div>
      </div>
      <div className="productSingle__suggested">
        <h5 style={{ marginTop: "3rem", marginBottom: "1rem" }}>
          You might also like
        </h5>
        <div className="products">
          {suggestions?.slice(0, 3).map((product) => (
            <Product id={product.id} item={product.data()} />
          ))}
        </div>
      </div>
    </div>
  );
}
export default ProductSingle;
