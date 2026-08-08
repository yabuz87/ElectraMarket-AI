import React, { useState } from "react";
import "./AddProduct.css";
import { useProductData } from "../store/useProductData";
import Spinner from "./Spinner";
import { PackagePlus } from "lucide-react";

export default function AddProduct() {
  const { addProduct,isAddingProduct } = useProductData();
  const [product, setProduct] = useState({
    name: "",
    model: "",
    price: 0,
    category: "",
    spec: "",
    productDate: new Date().toISOString().split("T")[0],
    placment: "not sold",
    image: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  // Helper to convert File to base64 string
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5 || files.some((file) => file.size > 5 * 1024 * 1024)) {
      window.alert("Choose up to 5 images, each no larger than 5 MB.");
      e.target.value = "";
      return;
    }
    const base64Images = await Promise.all(files.map((file) => toBase64(file)));

    setProduct((prev) => ({
      ...prev,
      image: [...prev.image, ...base64Images],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Parse spec JSON safely
    let specObj = {};
    if (product.spec.trim()) {
      try {
        specObj = JSON.parse(product.spec);
      } catch {
        alert("Specifications must be valid JSON!");
        return;
      }
    }

    const productToSend = {
      ...product,
      spec: specObj,
    };
    const added = await addProduct(productToSend);
    if (added) {
      setProduct({
        name: "",
        model: "",
        price: 0,
        category: "",
        spec: "",
        productDate: new Date().toISOString().split("T")[0],
        placment: "not sold",
        image: [],
      });
    }
  };

  return (
    

    <div className="container mt-5">
      <div className="p-5 rounded shadow-lg bg-white">
        <h2 className="mb-4 text-center text-primary fw-bold">
          Add New Electronics Product
        </h2>
        <form onSubmit={handleSubmit} className="row g-4">
          <div className="col-md-6">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              className="form-control form-control-lg"
              required
              onChange={handleChange}
              value={product.name}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Model</label>
            <input
              type="text"
              name="model"
              className="form-control form-control-lg"
              required
              onChange={handleChange}
              value={product.model}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Price</label>
            <input
              type="number"
              name="price"
              className="form-control form-control-lg"
              required
              onChange={handleChange}
              value={product.price}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Category</label>
            <input
              type="text"
              name="category"
              className="form-control form-control-lg"
              required
              onChange={handleChange}
              value={product.category}
            />
          </div>

          <div className="col-12">
            <label className="form-label">
              Specifications <small className="text-muted">(JSON format)</small>
            </label>
            <textarea
              name="spec"
              rows="3"
              className="form-control"
              placeholder='{"CPU":"i7","RAM":"16GB"}'
              onChange={handleChange}
              value={product.spec}
            ></textarea>
          </div>

          <div className="col-md-6">
            <label className="form-label">Product Date</label>
            <input
              type="date"
              name="productDate"
              className="form-control"
              onChange={handleChange}
              value={product.productDate}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Placement</label>
            <select
              name="placment"
              className="form-select"
              onChange={handleChange}
              value={product.placment}
            >
              <option value="not sold">Not Sold</option>
              <option value="on process">On Process</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label">
              Product Images <small className="text-muted">(Multiple Allowed)</small>
            </label>

            <input
              type="file"
              name="image"
              className="form-control"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />

            {product.image.length > 0 && (
              <input
                type="text"
                className="form-control mt-2"
                readOnly
                value={product.image
                  .map((img, i) => `Image ${i + 1}`)
                  .join(", ")}
              />
            )}
          </div>

          <div className="col-12 text-center mt-4">
  <button
    type="submit"
    className="btn btn-lg btn-primary px-5 shadow-sm"
    disabled={isAddingProduct} // Optional: disable button while submitting
  >
    {isAddingProduct ? (
      <>
        <Spinner /> Adding Product...
      </>
    ) : (
      <span className="d-inline-flex align-items-center gap-2">
        <PackagePlus aria-hidden="true" size={20} /> Submit Product
      </span>
    )}
  </button>
</div>

        </form>
      </div>
    </div>
    
  );
}
