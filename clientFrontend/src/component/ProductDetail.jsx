import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart, ThumbsUp } from "lucide-react";
import Spinner from "./Spinner";
import { useProductData } from "../store/useProductStore";
import { useAuthStore } from "../store/useAuthStore";

export default function ProductDetail() {
  const { _id } = useParams();
  const navigate = useNavigate();
  const product = useProductData((state) => state.singleProduct);
  const isLoading = useProductData((state) => state.isProductLoading);
  const fetchProductById = useProductData((state) => state.fetchProductById);
  const addToCart = useAuthStore((state) => state.addToCart);
  const authUser = useAuthStore((state) => state.authUser);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    fetchProductById(_id);
  }, [_id, fetchProductById]);

  if (isLoading || !product || product._id !== _id) {
    return (
      <div className="text-center my-5">
        <Spinner />
      </div>
    );
  }

  const images = product.image || [];
  const imageUrl =
    images[activeIndex]?.url || "https://via.placeholder.com/640x480";

  return (
    <main className="container my-5">
      <button className="btn btn-outline-secondary mb-4 d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft aria-hidden="true" size={18} /> Back to products
      </button>
      <div className="row g-4">
        <div className="col-md-6">
          <div className="position-relative">
            <img
              src={imageUrl}
              className="img-fluid rounded shadow"
              alt={product.name}
              width="640"
              height="480"
            />
            {images.length > 1 && (
              <>
                <button
                  className="btn btn-light position-absolute top-50 start-0 translate-middle-y"
                  aria-label="Previous image"
                  onClick={() =>
                    setActiveIndex((index) =>
                      index === 0 ? images.length - 1 : index - 1
                    )
                  }
                >
                  <ChevronLeft aria-hidden="true" size={22} />
                </button>
                <button
                  className="btn btn-light position-absolute top-50 end-0 translate-middle-y"
                  aria-label="Next image"
                  onClick={() =>
                    setActiveIndex((index) =>
                      index === images.length - 1 ? 0 : index + 1
                    )
                  }
                >
                  <ChevronRight aria-hidden="true" size={22} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <h1 className="h2 fw-bold text-primary">{product.name}</h1>
          <p className="text-muted">Model: {product.model}</p>
          <p className="fs-5 fw-semibold text-success">{product.price} ETB</p>
          <p>
            Category: <strong>{product.category}</strong>
          </p>
          <hr />
          <h2 className="h5">Specifications</h2>
          <ul className="list-group mb-3">
            {product.spec &&
              Object.entries(product.spec).map(([key, value]) => (
                <li key={key} className="list-group-item">
                  <strong>{key}:</strong> {String(value)}
                </li>
              ))}
          </ul>
          <p className="d-flex align-items-center gap-2">
            <ThumbsUp aria-hidden="true" size={18} /> {product.likes?.count || 0} likes
          </p>
          <button
            className="btn btn-primary px-4 fw-bold d-inline-flex align-items-center gap-2"
            onClick={() => {
              if (!authUser) return navigate("/login");
              addToCart(product, 1);
            }}
          >
            <ShoppingCart aria-hidden="true" size={18} /> Add to cart
          </button>
        </div>
      </div>
    </main>
  );
}
