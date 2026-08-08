import { useEffect, useMemo, useState } from "react";
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
import { BarChart2, Home, LogOut, Package, ShoppingCart, Upload, Users } from "lucide-react";
import "./AdminDashboard.css";
import ProductList from "./ProductList";
import AddProduct from "./AddProduct";
import OrderedPage from "./OrderedPage";
import Spinner from "./Spinner";
import { useAuthStore } from "../store/useAuthStore";
import { useProductData } from "../store/useProductData";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const STATUS_CLASS = {
  pending: "text-warning",
  shipped: "text-primary",
  delivered: "text-success",
  cancelled: "text-danger",
};

const safeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const products = useProductData((state) => state.products);
  const orders = useProductData((state) => state.orders);
  const isProductLoading = useProductData((state) => state.isProductLoading);
  const isOrderLoading = useProductData((state) => state.isOrderLoading);
  const fetchProductData = useProductData((state) => state.fetchProductData);
  const getOrders = useProductData((state) => state.getOrders);

  useEffect(() => {
    Promise.all([fetchProductData(), getOrders()]);
  }, [fetchProductData, getOrders]);

  const analytics = useMemo(() => buildAnalytics(products, orders), [products, orders]);

  const renderMainContent = () => {
    if (active === "products") return <ProductList />;
    if (active === "addProduct") return <AddProduct />;
    if (active === "orders") return <OrderedPage />;
    return (
      <DashboardOverview
        analytics={analytics}
        isLoading={isProductLoading || isOrderLoading}
      />
    );
  };

  return (
    <div className="d-flex admin-shell">
      <nav className="sidebar bg-dark text-white vh-100 p-3 position-fixed" style={{ width: "250px" }}>
        <h2 className="h3 text-center mb-4 fw-bold border-bottom pb-3">Electronics Admin</h2>
        <ul className="nav flex-column">
          <SidebarItem icon={Home} label="Dashboard" value="dashboard" active={active} setActive={setActive} />
          <SidebarItem icon={Package} label="Products" value="products" active={active} setActive={setActive} />
          <SidebarItem icon={Upload} label="Add Product" value="addProduct" active={active} setActive={setActive} />
          <SidebarItem icon={ShoppingCart} label="Orders" value="orders" active={active} setActive={setActive} extraClass="mt-4" />
          <li className="nav-item">
            <button className="nav-link btn btn-link text-danger text-start" onClick={logout} disabled={isLoggingOut}>
              <LogOut size={20} className="me-2" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </li>
        </ul>
      </nav>
      <main className="flex-grow-1 p-4" style={{ marginLeft: "250px", minHeight: "100vh" }}>
        {renderMainContent()}
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, value, active, setActive, extraClass = "" }) {
  return (
    <li className={`nav-item mb-2 ${extraClass}`}>
      <button
        className={`nav-link btn btn-link text-start ${active === value ? "active text-primary" : "text-white"}`}
        onClick={() => setActive(value)}
      >
        <Icon size={20} className="me-2" /> {label}
      </button>
    </li>
  );
}

function DashboardOverview({ analytics, isLoading }) {
  if (isLoading) return <div className="d-flex justify-content-center py-5"><Spinner /></div>;
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <>
      <header className="mb-4">
        <h1 className="display-5">Admin Dashboard</h1>
        <p className="text-muted">Live overview calculated from your products and orders</p>
      </header>

      <div className="row g-4">
        <MetricCard icon={ShoppingCart} color="primary" label="Orders" value={analytics.thisMonthOrderCount} caption="This month" />
        <MetricCard icon={Users} color="success" label="Customers" value={analytics.customerCount} caption="Customers who ordered from you" />
        <MetricCard icon={Package} color="warning" label="Products" value={analytics.productCount} caption="Your catalog" />
        <MetricCard icon={BarChart2} color="danger" label="Revenue" value={`${analytics.monthlyRevenue.toFixed(2)} ETB`} caption="This month, excluding cancelled" />
      </div>

      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm">
            <div className="card-header fw-bold">Revenue — last 6 months</div>
            <div className="card-body dashboard-chart"><Bar data={analytics.revenueData} options={chartOptions} /></div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm">
            <div className="card-header fw-bold">Units sold by category</div>
            <div className="card-body dashboard-chart"><Line data={analytics.salesData} options={chartOptions} /></div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm">
            <div className="card-header fw-bold">Recent Orders</div>
            <ul className="list-group list-group-flush">
              {analytics.recentOrders.length ? analytics.recentOrders.map((order) => (
                <li key={order._id} className="list-group-item d-flex justify-content-between gap-3">
                  <span className="text-truncate">Order {order.orderId}</span>
                  <span className={STATUS_CLASS[order.status] || "text-muted"}>{order.status}</span>
                </li>
              )) : <li className="list-group-item text-muted">No orders yet.</li>}
            </ul>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm">
            <div className="card-header fw-bold">Top Selling Products</div>
            <ul className="list-group list-group-flush">
              {analytics.topProducts.length ? analytics.topProducts.map((product) => (
                <li key={product.id} className="list-group-item d-flex justify-content-between gap-3">
                  <span className="text-truncate">{product.name}</span>
                  <span className="text-muted">{product.quantity} sold</span>
                </li>
              )) : <li className="list-group-item text-muted">No completed sales yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ icon: Icon, color, label, value, caption }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className={`card border-${color} h-100 shadow-sm`}>
        <div className="card-body">
          <h2 className={`h5 card-title text-${color} d-flex align-items-center gap-2`}><Icon size={20} /> {label}</h2>
          <p className="h3 card-text">{value}</p>
          <p className="text-muted mb-0">{caption}</p>
        </div>
      </div>
    </div>
  );
}

function buildAnalytics(products, orders) {
  const now = new Date();
  const productById = new Map(products.map((product) => [String(product._id), product]));
  const activeOrders = orders.filter((order) => order.status !== "cancelled");
  const fulfilledOrders = orders.filter((order) => ["shipped", "delivered"].includes(order.status));
  const thisMonthOrders = activeOrders.filter((order) => {
    const date = safeDate(order.orderDate);
    return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
    };
  });
  const revenueByMonth = new Map(months.map(({ key }) => [key, 0]));
  activeOrders.forEach((order) => {
    const date = safeDate(order.orderDate);
    if (!date) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (revenueByMonth.has(key)) revenueByMonth.set(key, revenueByMonth.get(key) + Number(order.totalAmount || 0));
  });

  const categoryUnits = new Map();
  const productUnits = new Map();
  fulfilledOrders.forEach((order) => {
    (order.products || []).forEach((item) => {
      const id = String(item.productId);
      const product = productById.get(id);
      const quantity = Number(item.quantity) || 0;
      const category = product?.category || "Uncategorized";
      categoryUnits.set(category, (categoryUnits.get(category) || 0) + quantity);
      productUnits.set(id, (productUnits.get(id) || 0) + quantity);
    });
  });

  const topProducts = [...productUnits.entries()]
    .map(([id, quantity]) => ({ id, quantity, name: productById.get(id)?.name || "Deleted product" }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 5);
  const categories = [...categoryUnits.keys()];

  return {
    productCount: products.length,
    customerCount: new Set(orders.map((order) => String(order.buyerId))).size,
    thisMonthOrderCount: thisMonthOrders.length,
    monthlyRevenue: thisMonthOrders.reduce((total, order) => total + Number(order.totalAmount || 0), 0),
    recentOrders: [...orders]
      .sort((left, right) => (safeDate(right.orderDate)?.getTime() || 0) - (safeDate(left.orderDate)?.getTime() || 0))
      .slice(0, 5),
    topProducts,
    revenueData: {
      labels: months.map(({ label }) => label),
      datasets: [{ label: "Revenue (ETB)", data: months.map(({ key }) => revenueByMonth.get(key)), backgroundColor: "rgba(13, 110, 253, 0.72)", borderRadius: 6 }],
    },
    salesData: {
      labels: categories.length ? categories : ["No sales"],
      datasets: [{ label: "Units sold", data: categories.length ? categories.map((category) => categoryUnits.get(category)) : [0], borderColor: "rgba(25, 135, 84, 0.85)", backgroundColor: "rgba(25, 135, 84, 0.14)", tension: 0.32, fill: true }],
    },
  };
}
