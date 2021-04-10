import React from "react";
import "./Main.css";
import Product from "./Product";
import { useStateValue } from "../StateProvider";

function Main() {
  const [{ products }] = useStateValue();
  return (
    <div className="main">
      <div className="products">
        {products?.map((product) => (
          <Product id={product.id} item={product.data()} />
        ))}
      </div>
    </div>
  );
}
export default Main;
