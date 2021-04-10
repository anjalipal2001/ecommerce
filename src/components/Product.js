import React from "react";
import "./Product.css";
import StarRateRoundedIcon from "@material-ui/icons/StarRateRounded";
import TextTruncate from "react-text-truncate";
import defaultImage from "../assets/default.jpg";
import { useHistory } from "react-router-dom";

function Product({ item, id }) {
  const history = useHistory();

  return (
    <div onClick={() => history.push(`/product/${id}`)} className="product">
      <div className="product__image">
        {item.discount && <span className="banner">Offer!</span>}
        <img src={item.imgUrl || defaultImage} />
      </div>
      <div className="product__details">
        <TextTruncate
          line={3}
          element="h6"
          containerClassName="product__name"
          truncateText="…"
          text={item.name}
        />
        <div className="product__footer">
          <p className="product__price">
            <b>${item.price}</b>{" "}
            {item.discount && (
              <small>
                <del>${item.originalPrice}</del>
              </small>
            )}
          </p>
          <div className="product__rating">
            <StarRateRoundedIcon style={{ color: "#f90" }} />
            {item.rating}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Product;
