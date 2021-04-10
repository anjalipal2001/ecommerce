import React from "react";
import "./Categories.css";

const categories = [
  "Arts & Crafts",
  "Automotive",
  "Baby",
  "Beauty & Personal Care",
  "Books",
  "Computers",
  "Electronics",
  "Kindle Store",
  "Prime Video",
  "Women's Fashion",
  "Men's Fashion",
  "Special Deals",
  "Health & Household",
  "Home & Kitchen",
  "Movies & TV",
  "Music, CDs & Vinyl",
  "Software",
  "Toys & Games",
];

function Categories() {
  const setActive = (e) => {
    let prevActive = document.querySelector(".categories__category.active");
    if (prevActive) prevActive.classList.remove("active");
    e.preventDefault();
    e.target.classList.add("active");
  };

  return (
    <div className="categories">
      <span
        className="categories__category active"
        onClick={(e) => setActive(e)}
      >
        All Departments
      </span>
      {categories.map((category) => (
        <span className="categories__category" onClick={(e) => setActive(e)}>
          {category}
        </span>
      ))}
    </div>
  );
}
export default Categories;
