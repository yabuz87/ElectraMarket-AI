import { useEffect } from "react";
import { useProductData } from "../store/useProductData";
import Spinner from "./Spinner";

const STATUSES = ["pending", "shipped", "delivered", "cancelled"];

export default function OrderedPage() {
  const {
    getOrders,
    orders,
    products,
    fetchProductData,
    changeOrderStatus,
    isOrderLoading,
  } = useProductData();

  useEffect(() => {
    getOrders();
    fetchProductData();
  }, [getOrders, fetchProductData]);

  const productName = (productId) =>
    products.find((item) => item._id === productId)?.name || "Unknown product";

  if (isOrderLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner />
      </div>
    );
  }

  return (
    <section className="container my-5">
      <h1 className="h2 mb-4 text-primary fw-bold text-center">All Orders</h1>
      {orders.length === 0 ? (
        <p className="text-center fs-5">No orders found.</p>
      ) : (
        orders.map((order) => (
          <article key={order._id} className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="h5">Order {order.orderId}</h2>
              <p className="mb-1">Customer: {order.buyerId}</p>
              <p className="mb-1">Address: {order.shippingAddress}</p>
              <p className="mb-3">
                Ordered: {new Date(order.orderDate).toLocaleString()}
              </p>
              <ul className="list-group mb-3">
                {order.products.map((item) => (
                  <li
                    key={item._id || item.productId}
                    className="list-group-item d-flex justify-content-between"
                  >
                    <span>
                      {productName(item.productId)} × {item.quantity}
                    </span>
                    <span>{(item.quantity * item.price).toFixed(2)} ETB</span>
                  </li>
                ))}
              </ul>
              <div className="d-flex justify-content-between align-items-center gap-3">
                <strong>Total: {order.totalAmount.toFixed(2)} ETB</strong>
                <label className="d-flex align-items-center gap-2">
                  Status
                  <select
                    className="form-select form-select-sm"
                    value={order.status}
                    onChange={(event) =>
                      changeOrderStatus(order.orderId, event.target.value)
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
