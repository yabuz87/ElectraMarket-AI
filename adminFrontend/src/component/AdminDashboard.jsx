import { useEffect, useMemo, useState } from "react";
import { Eye, Heart, Home, LogOut, MessageSquare, Moon, Package, Store, Sun, Upload, UserRound } from "lucide-react";
import AddProduct from "./AddProduct";
import ProductList from "./ProductList";
import Spinner from "./Spinner";
import { useAuthStore } from "../store/useAuthStore";
import { useProductData } from "../store/useProductData";
import { useThemeStore } from "../store/useThemeStore";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const products = useProductData((state) => state.products);
  const isProductLoading = useProductData((state) => state.isProductLoading);
  const fetchProductData = useProductData((state) => state.fetchProductData);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  useEffect(() => { fetchProductData(); }, [fetchProductData]);

  const analytics = useMemo(() => {
    const totals = products.reduce((result, product) => ({
      views: result.views + (Number(product.views?.count) || 0),
      likes: result.likes + (Number(product.likes?.count) || 0),
      comments: result.comments + (Number(product.commentCount) || 0),
    }), { views: 0, likes: 0, comments: 0 });
    const topProducts = [...products]
      .map((product) => ({
        ...product,
        engagement: (Number(product.views?.count) || 0) + (Number(product.likes?.count) || 0) * 3 + (Number(product.commentCount) || 0) * 4,
      }))
      .sort((left, right) => right.engagement - left.engagement)
      .slice(0, 5);
    return { ...totals, listings: products.length, topProducts };
  }, [products]);

  const renderMainContent = () => {
    if (active === "products") return <ProductList />;
    if (active === "addProduct") return <AddProduct />;
    if (active === "profile") return <SellerProfile />;
    return <DashboardOverview analytics={analytics} isLoading={isProductLoading} />;
  };

  return (
    <div className="admin-shell">
      <nav className="sidebar" aria-label="Seller dashboard">
        <div className="sidebar-brand"><span><Store size={21} /></span><div><strong>Electra</strong><small>Seller workspace</small></div></div>
        <ul className="nav flex-column">
          <SidebarItem icon={Home} label="Overview" value="dashboard" active={active} setActive={setActive} />
          <SidebarItem icon={Package} label="Listings" value="products" active={active} setActive={setActive} />
          <SidebarItem icon={Upload} label="Add listing" value="addProduct" active={active} setActive={setActive} />
          <SidebarItem icon={UserRound} label="Public profile" value="profile" active={active} setActive={setActive} />
          <li className="nav-item"><button className="nav-link sidebar-logout" onClick={logout} disabled={isLoggingOut}><LogOut size={20} />{isLoggingOut ? "Logging out…" : "Logout"}</button></li>
        </ul>
        <button className="admin-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </nav>
      <main className="admin-main">{renderMainContent()}</main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, value, active, setActive }) {
  return <li className="nav-item"><button className={`nav-link ${active === value ? "active" : ""}`} onClick={() => setActive(value)}><Icon size={20} />{label}</button></li>;
}

function DashboardOverview({ analytics, isLoading }) {
  if (isLoading) return <div className="d-flex justify-content-center py-5"><Spinner /></div>;
  return <>
    <header className="admin-heading"><span>Seller workspace</span><h1>Listing performance</h1><p>Real engagement from only the products published by your account.</p></header>
    <div className="admin-metrics">
      <MetricCard icon={Package} label="Listings" value={analytics.listings} caption="Products currently published" />
      <MetricCard icon={Eye} label="Views" value={analytics.views} caption="Product-detail visits" />
      <MetricCard icon={Heart} label="Likes" value={analytics.likes} caption="Viewer interest" />
      <MetricCard icon={MessageSquare} label="Comments" value={analytics.comments} caption="Public conversations" />
    </div>
    <section className="engagement-panel">
      <div><span>Engagement</span><h2>Your most active listings</h2></div>
      {analytics.topProducts.length ? <div className="engagement-list">{analytics.topProducts.map((product) => <article key={product._id}><img src={product.image?.[0]?.url || "https://placehold.co/96x96?text=Item"} alt="" /><div><strong>{product.name}</strong><small>{product.category}</small></div><div className="engagement-stats"><span><Eye size={15} /> {product.views?.count || 0}</span><span><Heart size={15} /> {product.likes?.count || 0}</span><span><MessageSquare size={15} /> {product.commentCount || 0}</span></div></article>)}</div> : <p className="text-muted mb-0">Add your first listing to begin collecting engagement.</p>}
    </section>
  </>;
}

function MetricCard({ icon: Icon, label, value, caption }) {
  return <article className="admin-metric"><span><Icon size={21} /></span><div><small>{label}</small><strong>{value}</strong><p>{caption}</p></div></article>;
}

function SellerProfile() {
  const admin = useAuthStore((state) => state.admin);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isUpdatingProfile = useAuthStore((state) => state.isUpdatingProfile);
  const [form, setForm] = useState({ fullName: admin?.fullName || "", phone: admin?.phone || "", address: admin?.address || "" });

  const submit = async (event) => {
    event.preventDefault();
    await updateProfile(form);
  };

  return <section className="profile-editor">
    <header className="admin-heading"><span>Public seller identity</span><h1>Owner profile</h1><p>These details appear on every product listing so interested viewers can contact you directly.</p></header>
    <form onSubmit={submit}>
      <label>Full name<input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required /></label>
      <label>Phone number<input type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required /></label>
      <label>Address<textarea rows="3" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} required /></label>
      <div className="profile-rating"><span>Public owner rating</span><strong>{Number(admin?.rating || 0).toFixed(1)} / 5</strong><small>Rating is read-only to protect marketplace integrity.</small></div>
      <button className="btn btn-primary" disabled={isUpdatingProfile}>{isUpdatingProfile ? <Spinner /> : "Save public profile"}</button>
    </form>
  </section>;
}
