import { ArrowRight, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function CartPage() {
  const navigate = useNavigate();
  const { authUser, cart, removeFromCart } = useAuthStore();
  const itemCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const totalAmount = cart.reduce((total, item) => total + Number(item.price) * (item.quantity || 1), 0);
  const formatPrice = (value) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ETB`;

  return (
    <main className="cart-page container">
      <div className="page-heading"><span className="eyebrow">Your selection</span><h1>Shopping cart</h1><p>{itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout</p></div>
      {cart.length === 0 ? (
        <div className="empty-catalog"><ShoppingBag size={38} /><h2>Your cart is empty</h2><p>Explore the catalog and add something you’ll love.</p><button className="btn btn-brand" onClick={() => navigate("/")}>Start shopping</button></div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Cart items">
            {cart.map((item) => <article className="cart-item" key={item._id}>
              <img src={item.image?.[0]?.url || "https://placehold.co/260x220/e9eef8/52617a?text=Product"} alt={item.name} />
              <div className="cart-item__content"><span className="product-category">{item.category || "Electronics"}</span><h2>{item.name}</h2><p>{formatPrice(Number(item.price))} × {item.quantity || 1}</p><strong>{formatPrice(Number(item.price) * (item.quantity || 1))}</strong></div>
              <button className="remove-item" onClick={() => removeFromCart(item._id)} aria-label={`Remove ${item.name}`}><Trash2 size={18} /><span>Remove</span></button>
            </article>)}
          </section>
          <aside className="order-summary">
            <h2>Order summary</h2>
            <div><span>Items ({itemCount})</span><span>{formatPrice(totalAmount)}</span></div>
            <div><span>Delivery</span><span>Calculated at checkout</span></div>
            <div className="order-summary__total"><strong>Total</strong><strong>{formatPrice(totalAmount)}</strong></div>
            <button className="btn btn-brand btn-lg w-100" onClick={() => navigate(authUser ? "/checkout" : "/login")}>Continue to checkout <ArrowRight size={19} /></button>
            <p><ShieldCheck size={16} /> Secure account checkout</p>
          </aside>
        </div>
      )}
    </main>
  );
}
