import React, { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useProductData } from "../store/useProductStore";
import Spinner from "./Spinner";

export default function OrdersPage() {
  const { authUser } = useAuthStore();
  const { fetchOrderHistory, orderHistory, products, fetchProductData, isOrderLoading } = useProductData();

  useEffect(() => {
    if (authUser) {
      fetchOrderHistory(authUser._id);
      fetchProductData();
    }
  }, [authUser, fetchOrderHistory, fetchProductData]);

  const getProduct = (productId) => {
    return products.find((p) => p._id === productId);
  };

  if (!authUser) return <p>Please login to view your orders.</p>;

  return (
    <div className="container my-5">
      <h2 className="mb-4 text-primary fw-bold text-center">Your Orders</h2>
      {isOrderLoading ? (
        <div className="text-center"><Spinner /></div>
      ) : orderHistory.length === 0 ? (
        <p className="text-center fs-5">No orders found.</p>
      ) : (
        orderHistory.map((order) => (
          <div key={order._id} className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Order ID: {order.orderId}</h5>
              <p className="mb-1"><strong>Status:</strong> {order.status}</p>
              <p className="mb-1"><strong>Shipping Address:</strong> {order.shippingAddress}</p>
              <p className="mb-3"><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
              <p className="mb-3"><strong>Delivery Date:</strong> {new Date(order.deliveryDate).toLocaleString()|| 'unkown'}</p>

              <h6 className="fw-bold">Ordered Items:</h6>
              <ul className="list-group mb-3">
                {order.products.map((item, index) => {
                  const product = getProduct(item.productId);
                  return (
                    <li
                      key={index}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div className="d-flex align-items-center gap-3">
                        {product?.image && (
                          <img
                            src={product.image[0]?.url || "https://via.placeholder.com/60"}
                            alt={product.name}
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "5px",
                            }}
                          />
                        )}
                        <div>
                          <strong>{product?.name || "Unknown Product"}</strong>
                          <div>Quantity: {item.quantity}</div>
                          <div>Price: {item.price} ETB</div>
                        </div>
                      </div>
                      <span className="fw-bold">
                        {(item.quantity * item.price).toFixed(2)} ETB
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="d-flex justify-content-between">
                <strong>Total:</strong>
                <strong>{order.totalAmount.toFixed(2)} ETB</strong>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
