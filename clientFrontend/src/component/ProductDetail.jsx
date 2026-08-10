import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Spinner from "./Spinner";
import ProductComments from "./ProductComments";
import { useProductData } from "../store/useProductStore";
import { useAuthStore } from "../store/useAuthStore";

export default function ProductDetail() {
  const { _id } = useParams();
  const navigate = useNavigate();
  const product = useProductData((state) => state.singleProduct);
  const isLoading = useProductData((state) => state.isProductLoading);
  const isLikeUpdating = useProductData((state) => state.isLikeUpdating);
  const fetchProductById = useProductData((state) => state.fetchProductById);
  const fetchLikeStatus = useProductData((state) => state.fetchLikeStatus);
  const toggleProductLike = useProductData((state) => state.toggleProductLike);
  const addToCart = useAuthStore((state) => state.addToCart);
  const authUser = useAuthStore((state) => state.authUser);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => { setActiveIndex(0); fetchProductById(_id); }, [_id, fetchProductById]);
  useEffect(() => { if (authUser && product?._id === _id) fetchLikeStatus(_id); }, [_id, authUser, fetchLikeStatus, product?._id]);

  if (isLoading || !product || product._id !== _id) return <div className="catalog-loading my-5 container"><Spinner /><span>Loading product details…</span></div>;

  const images = (product.image || []).filter((image) => image?.url);
  const imageUrl = images[activeIndex]?.url || "https://placehold.co/800x620/e9eef8/52617a?text=ElectraStore";
  const specs = Object.entries(product.spec || {});

  return (
    <main className="product-detail-page container">
      <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back to products</button>
      <div className="product-detail-grid">
        <section className="product-gallery" aria-label="Product images">
          <div className="product-gallery__main">
            <img src={imageUrl} alt={product.name} width="800" height="620" />
            {images.length > 1 && <>
              <button className="gallery-arrow gallery-arrow--left" aria-label="Previous image" onClick={() => setActiveIndex((index) => index === 0 ? images.length - 1 : index - 1)}><ChevronLeft /></button>
              <button className="gallery-arrow gallery-arrow--right" aria-label="Next image" onClick={() => setActiveIndex((index) => index === images.length - 1 ? 0 : index + 1)}><ChevronRight /></button>
            </>}
          </div>
          {images.length > 1 && <div className="product-thumbnails">{images.map((image, index) => <button key={image.publicId || image.url} className={index === activeIndex ? "active" : ""} onClick={() => setActiveIndex(index)}><img src={image.url} alt={`${product.name} view ${index + 1}`} /></button>)}</div>}
        </section>

        <section className="product-info">
          <span className="product-category">{product.category || "Electronics"}</span>
          <h1>{product.name}</h1>
          {product.model && <p className="product-info__model">Model: {product.model}</p>}
          <div className="product-info__price">{new Intl.NumberFormat("en-US").format(Number(product.price) || 0)} <small>ETB</small></div>
          <div className="product-info__actions">
            <button className="btn btn-brand btn-lg" onClick={() => { if (!authUser) return navigate("/login"); addToCart(product, 1); }}><ShoppingBag size={19} /> Add to cart</button>
            <button className={`like-button ${authUser && product.likedByUser ? "active" : ""}`} aria-pressed={Boolean(authUser && product.likedByUser)} disabled={isLikeUpdating} onClick={async () => { if (!authUser) return navigate("/login"); await toggleProductLike(product._id); }}><Heart size={19} fill={authUser && product.likedByUser ? "currentColor" : "none"} /> {product.likes?.count || 0}</button>
          </div>
          <div className="product-assurances">
            <div><ShieldCheck size={20} /><span><strong>Secure purchase</strong><small>Account-protected checkout</small></span></div>
            <div><Truck size={20} /><span><strong>Delivery options</strong><small>Confirmed during checkout</small></span></div>
          </div>
          {specs.length > 0 && <div className="specifications"><h2>Product specifications</h2><dl>{specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl></div>}
        </section>
      </div>
      <ProductComments productId={product._id} />
    </main>
  );
}
