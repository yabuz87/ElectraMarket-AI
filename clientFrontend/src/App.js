import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ClientNavbar from "./component/Navbar";
import Spinner from "./component/Spinner";
import { useAuthStore } from "./store/useAuthStore";

const About = lazy(() => import("./component/About"));
const Cart = lazy(() => import("./component/Cart"));
const Checkout = lazy(() => import("./component/CheckOut"));
const FloatingChat = lazy(() => import("./component/FloatingChat"));
const Login = lazy(() => import("./component/Login"));
const Logout = lazy(() => import("./component/Logout"));
const OrdersPage = lazy(() => import("./component/OrdersPage"));
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
  const authUser = useAuthStore((state) => state.authUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <ClientNavbar />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<ProductShowcase />} />
          <Route path="/about" element={<About />} />
          <Route path="/product/:_id" element={<ProductDetail />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute authUser={authUser} isCheckingAuth={isCheckingAuth}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute authUser={authUser} isCheckingAuth={isCheckingAuth}>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route path="/logout" element={<Logout />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute authUser={authUser} isCheckingAuth={isCheckingAuth}>
                <Checkout />
              </ProtectedRoute>
            }
          />
        </Routes>
        <FloatingChat />
      </Suspense>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </Router>
  );
}

function ProtectedRoute({ authUser, isCheckingAuth, children }) {
  if (isCheckingAuth) return <LoadingScreen />;
  return authUser ? children : <Login />;
}

export default App;
