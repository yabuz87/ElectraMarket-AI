import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import Spinner from "./Spinner";
import { useProductData } from "../store/useProductStore";
import { useAuthStore } from "../store/useAuthStore";

const PRODUCTS_PER_PAGE = 8;

export default function ProductShowcase() {
  const products = useProductData((state) => state.products);
  const totalProducts = useProductData((state) => state.totalProducts);
  const isProductLoading = useProductData((state) => state.isProductLoading);
  const isSearching = useProductData((state) => state.isSearching);
  const fetchProductData = useProductData((state) => state.fetchProductData);
  const search = useProductData((state) => state.search);
  const addToCart = useAuthStore((state) => state.addToCart);
  const authUser = useAuthStore((state) => state.authUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = searchQuery.trim();
      if (!value) {
        fetchProductData(currentPage, PRODUCTS_PER_PAGE);
        return;
      }

      search({
        searchType: /^\d+(\.\d+)?$/.test(value) ? "price" : "text",
        value,
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
      });
    }, searchQuery ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [currentPage, fetchProductData, search, searchQuery]);

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  if (isProductLoading || isSearching) {
    return (
      <div className="text-center my-5">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="container my-5">
      <h1 className="h2 mb-4 fw-bold text-center text-primary">Featured Products</h1>

      <div className="mb-4 d-flex justify-content-center">
        <label className="visually-hidden" htmlFor="product-search">
          Search products
        </label>
        <input
          id="product-search"
          type="search"
          className="form-control w-50"
          placeholder="Search by name, model, category, or maximum price"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="row g-4">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <ProductCard
                product={product}
                authUser={authUser}
                navigate={navigate}
                addToCart={addToCart}
              />
            </div>
          ))
        ) : (
          <p className="text-center">No products found.</p>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          className="d-flex justify-content-center mt-4 gap-2"
          aria-label="Product pages"
        >
          <button
            className="btn btn-sm btn-outline-primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            Previous
          </button>
          <span className="align-content-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-sm btn-outline-primary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}

function ProductCard({ product, authUser, navigate, addToCart }) {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = (event) => {
    event.stopPropagation();
    if (!authUser) {
      navigate("/login");
      return;
    }
    addToCart(product, quantity);
  };

  return (
    <article
      className="card shadow-sm h-100 product-card"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <ProductImageCarousel images={product.image || []} productName={product.name} />
      <div className="card-body d-flex flex-column">
        <h2 className="h5 card-title">{product.name}</h2>
        <p className="text-muted mb-1">Category: {product.category}</p>
        <p className="fw-bold mb-3">{Number(product.price).toFixed(2)} ETB</p>

        <div className="mt-auto d-flex flex-column gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/product/${product._id}`);
            }}
          >
            View Details
          </button>
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              aria-label={`Quantity for ${product.name}`}
              value={quantity}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setQuantity(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5].map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1" onClick={handleAddToCart}>
              <ShoppingCart aria-hidden="true" size={16} /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductImageCarousel({ images, productName }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const placeholder = "https://via.placeholder.com/360x240";

  const changeImage = (event, direction) => {
    event.stopPropagation();
    setActiveIndex((index) => {
      if (direction === "previous") return index === 0 ? images.length - 1 : index - 1;
      return index === images.length - 1 ? 0 : index + 1;
    });
  };

  return (
    <div className="position-relative product-image-carousel">
      <img
        src={images[activeIndex]?.url || placeholder}
        alt={images.length ? productName : "Product placeholder"}
        loading="lazy"
        decoding="async"
        width="360"
        height="240"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(event) => changeImage(event, "previous")}
            className="btn btn-sm btn-light position-absolute top-50 start-0 translate-middle-y"
            aria-label="Previous image"
          >
            <ChevronLeft aria-hidden="true" size={20} />
          </button>
          <button
            onClick={(event) => changeImage(event, "next")}
            className="btn btn-sm btn-light position-absolute top-50 end-0 translate-middle-y"
            aria-label="Next image"
          >
            <ChevronRight aria-hidden="true" size={20} />
          </button>
        </>
      )}
    </div>
  );
}
