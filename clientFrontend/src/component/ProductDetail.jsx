"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Star,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import Spinner from "./Spinner";
import ProductComments from "./ProductComments";
import { useProductData } from "../store/useProductStore";
import { useAuthStore } from "../store/useAuthStore";
import { apiBaseUrl } from "../utils";

const shareTargets = (url, title) => [
  { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { label: "X", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
];

export default function ProductDetail({ productId, initialProduct }) {
  const router = useRouter();
  const liveProduct = useProductData((state) => state.singleProduct);
  const product = liveProduct?._id === productId ? liveProduct : initialProduct;
  const isLoading = useProductData((state) => state.isProductLoading);
  const isLikeUpdating = useProductData((state) => state.isLikeUpdating);
  const fetchProductById = useProductData((state) => state.fetchProductById);
  const trackProductView = useProductData((state) => state.trackProductView);
  const fetchLikeStatus = useProductData((state) => state.fetchLikeStatus);
  const toggleProductLike = useProductData((state) => state.toggleProductLike);
  const applyRealtimeLike = useProductData((state) => state.applyRealtimeLike);
  const authUser = useAuthStore((state) => state.authUser);
  const [activeIndex, setActiveIndex] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    if (initialProduct) useProductData.setState({ singleProduct: initialProduct });
    else fetchProductById(productId);
    trackProductView(productId);
  }, [fetchProductById, initialProduct, productId, trackProductView]);
  useEffect(() => {
    if (authUser && product?._id === productId) fetchLikeStatus(productId);
  }, [productId, authUser, fetchLikeStatus, product?._id]);
  useEffect(() => {
    const source = new EventSource(`${apiBaseUrl}/product/events/${productId}`);
    const receiveUpdate = (event) => {
      try {
        const update = JSON.parse(event.data);
        if (update.type === "like.updated") {
          applyRealtimeLike({ productId, count: update.data?.count });
        }
        if (update.type === "comment.created" || update.type === "comment.deleted") {
          window.dispatchEvent(new CustomEvent("product:comments-changed", { detail: { productId } }));
        }
      } catch {
        // Ignore malformed or stale event payloads; normal API reads remain authoritative.
      }
    };
    source.addEventListener("product-update", receiveUpdate);
    return () => {
      source.removeEventListener("product-update", receiveUpdate);
      source.close();
    };
  }, [applyRealtimeLike, productId]);

  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const targets = useMemo(() => shareTargets(shareUrl, product?.name || "Product listing"), [product?.name, shareUrl]);

  if ((isLoading && !initialProduct) || !product || product._id !== productId) {
    return <div className="catalog-loading my-5 container"><Spinner /><span>Loading product details…</span></div>;
  }

  const images = (product.image || []).filter((image) => image?.url);
  const imageUrl = images[activeIndex]?.url || "https://placehold.co/800x620/e9eef8/52617a?text=ElectraStore";
  const specs = Object.entries(product.spec || {});
  const owner = product.salerId || {};
  const phoneHref = owner.phone ? `tel:${String(owner.phone).replace(/[^+\d]/g, "")}` : null;

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `View ${product.name} on ElectraMarket`, url: shareUrl });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    setShareOpen((open) => !open);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <main className="product-detail-page container">
      <button className="back-link" onClick={() => router.back()}><ArrowLeft size={18} /> Back to listings</button>
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
          <div className="product-info__price"><span>Asking price</span>{new Intl.NumberFormat("en-US").format(Number(product.price) || 0)} <small>ETB</small></div>
          <div className="product-info__actions">
            {phoneHref ? <a className="btn btn-brand btn-lg" href={phoneHref}><Phone size={19} /> Call owner</a> : <button className="btn btn-brand btn-lg" disabled><Phone size={19} /> Phone unavailable</button>}
            <button className={`like-button ${authUser && product.likedByUser ? "active" : ""}`} aria-pressed={Boolean(authUser && product.likedByUser)} disabled={isLikeUpdating} onClick={async () => { if (!authUser) return router.push("/login"); await toggleProductLike(product._id); }}><Heart size={19} fill={authUser && product.likedByUser ? "currentColor" : "none"} /> {product.likes?.count || 0}</button>
            <button className="like-button" aria-expanded={shareOpen} onClick={shareProduct}><Share2 size={19} /> Share</button>
          </div>
          {shareOpen && <div className="share-panel" aria-label="Share this listing">
            {targets.map((target) => <a key={target.label} href={target.href} target="_blank" rel="noreferrer">{target.label}</a>)}
            <button onClick={copyLink}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy link"}</button>
          </div>}

          <aside className="seller-card" aria-label="Product owner details">
            <div className="seller-card__avatar">{owner.profileImage ? <img src={owner.profileImage} alt="" /> : <UserRound size={25} />}</div>
            <div className="seller-card__identity"><small>Listed by</small><strong>{owner.fullName || "Product owner"}</strong><span><Star size={15} fill="currentColor" /> {Number(owner.rating || 0).toFixed(1)} owner rating</span></div>
            <div className="seller-card__contact">
              {owner.phone && <a href={phoneHref}><Phone size={17} /><span><small>Phone</small>{owner.phone}</span></a>}
              <div><MapPin size={17} /><span><small>Address</small>{owner.address || "Ask the owner for their location"}</span></div>
            </div>
          </aside>

          <div className="marketplace-notice"><MessageCircle size={20} /><span><strong>Contact the owner directly</strong><small>ElectraMarket displays listings and does not handle payments, orders, or delivery.</small></span></div>
          {specs.length > 0 && <div className="specifications"><h2>Product specifications</h2><dl>{specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl></div>}
        </section>
      </div>
      <ProductComments productId={product._id} />
    </main>
  );
}
