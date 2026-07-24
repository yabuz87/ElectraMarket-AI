import React, { useEffect, useState } from "react";
import { Home, Package, Upload, ShoppingCart, Users, BarChart2, LogOut } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./AdminDashboard.css";

// Import your pages/components here
import ProductList from "./ProductList";
import AddProduct from "./AddProduct";
import OrderedPage from "./OrderedPage"
import { useAuthStore } from "../store/useAuthStore";
import { useProductData } from "../store/useProductData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const revenueData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  datasets: [
    {
      label: "Revenue ($)",
      data: [12000, 15000, 14000, 16000, 19000, 22000, 25000, 21000],
      backgroundColor: "rgba(13, 110, 253, 0.7)",
      borderRadius: 5,
    },
  ],
};

const salesData = {
  labels: ["Smartphones", "Laptops", "Headphones", "TVs", "Accessories"],
  datasets: [
    {
      label: "Units Sold",
      data: [320, 154, 289, 92, 58],
      fill: false,
      borderColor: "rgba(40, 167, 69, 0.7)",
      tension: 0.3,
    },
  ],
};

export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const products = useProductData((state) => state.products);
  const users = useProductData((state) => state.users);
  const orders = useProductData((state) => state.orders);
  const fetchProductData = useProductData((state) => state.fetchProductData);
  const getAllUsers = useProductData((state) => state.getAllUsers);
  const getOrders = useProductData((state) => state.getOrders);

  useEffect(() => {
    Promise.all([fetchProductData(), getAllUsers(), getOrders()]);
  }, [fetchProductData, getAllUsers, getOrders]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthOrders = orders.filter((order) => {
    const date = new Date(order.orderDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const monthlyRevenue = thisMonthOrders
    .filter((order) => order.status !== "cancelled")
    .reduce((total, order) => total + Number(order.totalAmount || 0), 0);

  // Function to render main content based on active tab
  const renderMainContent = () => {
    switch (active) {
      case "dashboard":
        return (
          <>
            <header className="mb-4">
              <h1 className="display-4">Admin Dashboard</h1>
              <p className="text-muted">Overview of your electronics store</p>
            </header>

            <div className="row g-4">
              <div className="col-md-3">
                <div className="card border-primary h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title text-primary d-flex align-items-center gap-2">
                      <ShoppingCart size={20} /> Orders
                    </h5>
                    <h3 className="card-text">{thisMonthOrders.length}</h3>
                    <p className="text-muted">This month</p>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-success h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title text-success d-flex align-items-center gap-2">
                      <Users size={20} /> Customers
                    </h5>
                    <h3 className="card-text">{users.length}</h3>
                    <p className="text-muted">Registered customers</p>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-warning h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title text-warning d-flex align-items-center gap-2">
                      <Package size={20} /> Products
                    </h5>
                    <h3 className="card-text">{products.length}</h3>
                    <p className="text-muted">Total in inventory</p>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-danger h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title text-danger d-flex align-items-center gap-2">
                      <BarChart2 size={20} /> Revenue
                    </h5>
                    <h3 className="card-text">{monthlyRevenue.toFixed(2)} ETB</h3>
                    <p className="text-muted">This month</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4 mt-4">
              <div className="col-lg-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-header fw-bold">Monthly Revenue</div>
                  <div className="card-body">
                    <Bar
                      data={revenueData}
                      options={{ responsive: true, plugins: { legend: { display: true } } }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-header fw-bold">Sales by Category</div>
                  <div className="card-body">
                    <Line
                      data={salesData}
                      options={{ responsive: true, plugins: { legend: { display: true } } }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4 mt-4">
              <div className="col-lg-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-header fw-bold">Recent Orders</div>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Order #5678</span>
                      <span className="text-success">Completed</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Order #5677</span>
                      <span className="text-warning">Pending</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Order #5676</span>
                      <span className="text-danger">Cancelled</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-header fw-bold">Top Selling Products</div>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Smartphone X</span>
                      <span className="text-muted">320 sold</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Wireless Headphones</span>
                      <span className="text-muted">289 sold</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Gaming Laptop Pro</span>
                      <span className="text-muted">154 sold</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        );
      case "products":
        return <ProductList />;
      case "addProduct":
        return <AddProduct />;
      case "orders":
       return <OrderedPage/>;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <nav
        className="sidebar bg-dark text-white vh-100 p-3 position-fixed"
        style={{ width: "250px" }}
      >
        <h3 className="text-center mb-4 fw-bold border-bottom pb-3">
          Electronics Admin
        </h3>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <button
              className={`nav-link btn btn-link text-start ${
                active === "dashboard" ? "active text-primary" : "text-white"
              }`}
              onClick={() => setActive("dashboard")}
            >
              <Home size={20} className="me-2" />
              Dashboard
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link btn btn-link text-start ${
                active === "products" ? "active text-primary" : "text-white"
              }`}
              onClick={() => setActive("products")}
            >
              <Package size={20} className="me-2" />
              Products
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link btn btn-link text-start ${
                active === "addProduct" ? "active text-primary" : "text-white"
              }`}
              onClick={() => setActive("addProduct")}
            >
              <Upload size={20} className="me-2" />
              Add Product
            </button>
          </li>
          {/* other sidebar items */}
          <li className="nav-item mt-4 mb-2">
            <button
                className={`nav-link btn btn-link text-start ${
                active === "orders" ? "active text-primary" : "text-white"
              }`}
              onClick={() => setActive("orders")}
            >
              <ShoppingCart  size={20} className="me-2" />
              Orders
            </button>
          </li>
          <li className="nav-item">
            <button
              className="nav-link btn btn-link text-danger text-start"
              onClick={logout}
              disabled={isLoggingOut}
            >
              <LogOut size={20} className="me-2" />
              {isLoggingOut ? "Logging out…" : "Logout"}
            </button>
          </li>
        </ul>
      </nav>

      {/* Main content */}
      <main
        className="flex-grow-1 p-4"
        style={{ marginLeft: "250px", minHeight: "100vh" }}
      >
        {renderMainContent()}
      </main>
    </div>
  );
}
