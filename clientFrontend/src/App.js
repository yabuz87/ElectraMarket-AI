import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ClientNavbar from "./component/Navbar";
import Footer from "./component/Footer";
import Spinner from "./component/Spinner";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

const About = lazy(() => import("./component/About"));
const FloatingChat = lazy(() => import("./component/FloatingChat"));
const Login = lazy(() => import("./component/Login"));
const Logout = lazy(() => import("./component/Logout"));
const ProductDetail = lazy(() => import("./component/ProductDetail"));
const ProductShowcase = lazy(() => import("./component/ProductShowcase"));
const Signup = lazy(() => import("./component/Signup"));
const VerifyEmail = lazy(() => import("./component/VerifyEmail"));

const LoadingScreen = () => (
  <div className="d-flex justify-content-center py-5">
    <Spinner />
  </div>
);

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    checkAuth();
    initializeTheme();
  }, [checkAuth, initializeTheme]);

  return (
    <Router>
      <ClientNavbar />
      <div className="site-content"><Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<ProductShowcase />} />
          <Route path="/about" element={<About />} />
          <Route path="/product/:_id" element={<ProductDetail />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
        <FloatingChat />
      </Suspense></div>
      <Footer />
      <ToastContainer position="bottom-right" autoClose={3000} />
    </Router>
  );
}

export default App;
