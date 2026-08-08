import React, { useEffect, useMemo, useState } from "react";
import Spinner from "./Spinner";
import { useProductData } from "../store/useProductData";
import { dateFormatter } from "../utils";
import { ChevronLeft, ChevronRight, ClipboardList, Pencil, Trash2 } from "lucide-react";

export default function ProductList() {
  const { products, isProductLoading, fetchProductData,deleteProduct,isDeleting} = useProductData();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);
 const handleDeleteProduct = (id) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this product?");
  if (confirmDelete) {
    deleteProduct(id);
  }
};


  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [products, searchQuery]
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="container mt-5">
      {isProductLoading || isDeleting ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
  <Spinner />
</div>

      ) : (
        <>
          <h2 className="text-center mb-4 fw-bold text-primary d-flex align-items-center justify-content-center gap-2">
            <ClipboardList aria-hidden="true" size={28} /> Product Management
          </h2>

          {/* 🔍 Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* 🖼 Product Cards */}
          <div className="row g-4">
            {currentProducts.map((product, index) => (
              <div key={product._id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm h-100 admin-product-card">
                  <div
                    id={`carousel-${product._id}`}
                    className="carousel slide"
                    data-bs-ride="carousel"
                    data-bs-interval="3000"
                  >
                    <div className="carousel-inner">
                      {product.image?.map((img, idx) => (
                        <div
                          key={img.publicId || idx}
                          className={`carousel-item ${idx === 0 ? "active" : ""}`}
                        >
                          <img
                            src={img.url}
                            className="d-block w-100"
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      className="carousel-control-prev"
                      type="button"
                      data-bs-target={`#carousel-${product._id}`}
                      data-bs-slide="prev"
                    >
                      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    </button>
                    <button
                      className="carousel-control-next"
                      type="button"
                      data-bs-target={`#carousel-${product._id}`}
                      data-bs-slide="next"
                    >
                      <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    </button>
                  </div>

                  <div className="card-body">
                    <h5 className="card-title fw-bold text-dark">{product.name}</h5>
                    <p className="card-text text-muted">Model: {product.model}</p>
                    <p className="card-text">Category: <strong>{product.category}</strong></p>
                    <p className="card-text">Condition: <strong>{product.spec?.condition || "Not specified"}</strong></p>
                    <p className="card-text">production Date: <strong> { dateFormatter(product.productDate)}</strong></p>
                    <p className="card-text text-success fw-semibold">Price: {product.price} ETB</p>
                    <div className="d-flex justify-content-between">
                    <button className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1">
                      <Pencil aria-hidden="true" size={15} /> Edit
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                      onClick={() => handleDeleteProduct(product._id)}
                    >
                      <Trash2 aria-hidden="true" size={15} /> Delete
                    </button>
                  </div>

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 📄 Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center mt-4 gap-3">
              <button
                onClick={goToPrevPage}
                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                disabled={currentPage === 1}
              >
                <ChevronLeft aria-hidden="true" size={16} /> Previous
              </button>
              <span className="fw-bold">Page {currentPage} of {totalPages}</span>
              <button
                onClick={goToNextPage}
                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
