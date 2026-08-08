import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

export default function CartPage() {
  const navigate = useNavigate();
  const { authUser, cart, removeFromCart } = useAuthStore();

  // Calculate total amount dynamically, multiply price * quantity
  const totalAmount = cart.reduce(
    (acc, item) => acc + item.price * (item.quantity || 1),
    0
  );

  // Remove item handler
  const removeItem = (id) => {
    removeFromCart(id);
  };

  return (
    <>
    <div className="container my-5">
      <h2 className="mb-4 text-primary fw-bold text-center">Your Cart</h2>
      <div className="row">
        {/* Cart Items */}
        <div className="col-lg-8 mb-4">
          {cart.length === 0 ? (
            <p className="text-center fs-5">Your cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div
                key={item._id}
                className="card mb-3 shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <div className="row g-0 align-items-center">
                  <div className="col-4 col-md-3">
                    <img
                      src={item.image?.[0]?.url || "https://via.placeholder.com/150"}
                      alt={item.name}
                      className="img-fluid rounded-start"
                      style={{ maxHeight: "120px", objectFit: "cover" }}
                    />
                  </div>
                  <div className="col-8 col-md-9">
                    <div className="card-body d-flex flex-column justify-content-center h-100">
                      <h5 className="card-title mb-1">{item.name}</h5>
                      <p className="card-text mb-2 text-success fs-5 fw-semibold">
                        {item.price.toFixed(2)} ETB
                      </p>
                      <p className="card-text mb-2">
                        Quantity: <strong>{item.quantity || 1}</strong>
                      </p>
                      <p className="card-text mb-2 fw-bold">
                        Subtotal: {(item.price * (item.quantity || 1)).toFixed(2)} ETB
                      </p>
                      <div className="d-flex align-items-center gap-3">
                        <button
                          className="btn btn-danger btn-sm ms-auto"
                          onClick={() => removeItem(item._id)}
                          title="Remove item"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Sidebar */}
        <div className="col-lg-4">
          <div
            className="sticky-top p-4 shadow rounded"
            style={{ top: "100px", backgroundColor: "#f8f9fa" }}
          >
            <h4 className="mb-3 fw-bold">Order Summary</h4>

            <div className="d-flex justify-content-between mb-2">
              <span>
                Items ({cart.reduce((acc, item) => acc + (item.quantity || 1), 0)})
              </span>
              <span>{totalAmount.toFixed(2)} ETB</span>
            </div>
            <hr />

            {/* Add more fees if needed */}
            <div className="d-flex justify-content-between mb-3">
              <strong>Total</strong>
              <strong>{totalAmount.toFixed(2)} ETB</strong>
            </div>

            <button
              className="btn btn-primary w-100 fw-bold"
              disabled={cart.length === 0}
              onClick={() => {
                if (!authUser) {
                  navigate("/login");
                  return;
                }
                navigate("/checkout");
              }}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
