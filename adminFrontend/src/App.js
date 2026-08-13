import { lazy, Suspense, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import AdminLogin from "./component/AdminLogin";
import Spinner from "./component/Spinner";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

const AdminDashboard = lazy(() => import("./component/AdminDashboard"));

export default function App() {
  const admin = useAuthStore((state) => state.admin);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
    checkAuth();
  }, [checkAuth, initializeTheme]);

  return (
    <>
      {isCheckingAuth ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner />
        </div>
      ) : admin ? (
        <Suspense
          fallback={
            <div className="d-flex justify-content-center py-5">
              <Spinner />
            </div>
          }
        >
          <AdminDashboard />
        </Suspense>
      ) : (
        <AdminLogin />
      )}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </>
  );
}
