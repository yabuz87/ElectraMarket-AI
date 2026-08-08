import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useProductData } from "../store/useProductStore";
import Spinner from "./Spinner";

const SHIPPING_OPTIONS = [
  { id: "fast", label: "5 days (100 ETB per item)", feePerItem: 100 },
  { id: "normal", label: "7 days (50 ETB per item)", feePerItem: 50 },
  { id: "slow", label: "30 days (10 ETB per item)", feePerItem: 10 },
];

const readAssistantDraft = () => {
  try {
    const draft = JSON.parse(sessionStorage.getItem("assistantCheckout"));
    sessionStorage.removeItem("assistantCheckout");
    return draft || {};
  } catch {
    return {};
  }
};

export default function Checkout() {
  const authUser = useAuthStore((state) => state.authUser);
  const cart = useAuthStore((state) => state.cart);
  const clearCart = useAuthStore((state) => state.clearCart);
  const {
    createOrder,
    orderHistory,
    products,
    fetchOrderHistory,
    fetchProductData,
    isOrderCreating,
    isOrderLoading,
  } = useProductData();
  const [draft] = useState(readAssistantDraft);
  const [shippingAddress, setShippingAddress] = useState(
    draft.shippingAddress || ""
  );
  const [shippingOption, setShippingOption] = useState(
    SHIPPING_OPTIONS.some((option) => option.id === draft.shippingOption)
      ? draft.shippingOption
      : "normal"
  );
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    if (!authUser) return;
    fetchOrderHistory(authUser._id);
    fetchProductData();
  }, [authUser, fetchOrderHistory, fetchProductData]);

  const itemCount = cart.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );
  const productsTotal = cart.reduce(
    (total, item) => total + item.price * (item.quantity || 1),
    0
  );
  const selectedShipping =
    SHIPPING_OPTIONS.find((option) => option.id === shippingOption) ||
    SHIPPING_OPTIONS[1];
  const shippingFee = selectedShipping.feePerItem * itemCount;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitMessage("");
    if (!shippingAddress.trim()) {
      setSubmitMessage("Please enter a shipping address.");
      return;
    }
    if (!cart.length) {
      setSubmitMessage("Your cart is empty.");
      return;
    }

    const order = await createOrder({
      shippingAddress: shippingAddress.trim(),
      shippingOption,
      products: cart.map(({ _id, quantity }) => ({
        productId: _id,
        quantity: quantity || 1,
      })),
    });

    if (order) {
      clearCart();
      setSubmitMessage("Your order was placed successfully.");
    }
  };

  const productName = (productId) =>
    products.find((product) => product._id === productId)?.name ||
    "Unknown product";

  if (!authUser) return <p>Please log in to proceed with checkout.</p>;

  return (
    <main className="container my-5" style={{ maxWidth: 960 }}>
      <h1 className="h2 mb-4 text-primary">Checkout</h1>
      <div className="row g-4">
        <section className="col-md-7">
          <h2 className="h5">Cart summary</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <ul className="list-group mb-4">
              {cart.map((item) => (
                <li
                  key={item._id}
                  className="list-group-item d-flex justify-content-between"
                >
                  <span>
                    <strong>{item.name}</strong>
                    <br />
                    Quantity: {item.quantity || 1}
                  </span>
                  <span>
                    {(item.price * (item.quantity || 1)).toFixed(2)} ETB
                  </span>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="shippingAddress" className="form-label">
                Shipping address
              </label>
              <textarea
                id="shippingAddress"
                className="form-control"
                rows="3"
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
                required
              />
            </div>

            <fieldset className="mb-3">
              <legend className="h6">Shipping option</legend>
              {SHIPPING_OPTIONS.map(({ id, label }) => (
                <div key={id} className="form-check">
                  <input
                    type="radio"
                    id={id}
                    name="shippingOption"
                    className="form-check-input"
                    value={id}
                    checked={shippingOption === id}
                    onChange={(event) => setShippingOption(event.target.value)}
                  />
                  <label htmlFor={id} className="form-check-label">
                    {label}
                  </label>
                </div>
              ))}
            </fieldset>

            <div className="mb-4">
              <p>
                Products: <strong>{productsTotal.toFixed(2)} ETB</strong>
              </p>
              <p>
                Shipping: <strong>{shippingFee.toFixed(2)} ETB</strong>
              </p>
              <p>
                Total:{" "}
                <strong>{(productsTotal + shippingFee).toFixed(2)} ETB</strong>
              </p>
            </div>

            {submitMessage && <div className="alert alert-info">{submitMessage}</div>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isOrderCreating || !cart.length}
            >
              {isOrderCreating ? "Placing order..." : "Place order"}
            </button>
          </form>
        </section>

        <section className="col-md-5">
          <h2 className="h5">Past orders</h2>
          {isOrderLoading ? (
            <Spinner />
          ) : orderHistory.length === 0 ? (
            <p>No past orders found.</p>
          ) : (
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {orderHistory.map((order) => (
                <article key={order._id} className="card mb-3 shadow-sm">
                  <div className="card-body">
                    <h3 className="h6">Order {order.orderId}</h3>
                    <p className="mb-1">Status: {order.status}</p>
                    <p className="mb-1">Address: {order.shippingAddress}</p>
                    <ul className="list-group list-group-flush">
                      {order.products.map((item) => (
                        <li
                          key={item._id || item.productId}
                          className="list-group-item"
                        >
                          {productName(item.productId)} x {item.quantity}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 fw-bold">
                      Total: {order.totalAmount.toFixed(2)} ETB
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
