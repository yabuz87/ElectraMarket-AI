import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "./Spinner";
import { useAuthStore } from "../store/useAuthStore";

export default function Logout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (!hasLoggedOut.current) {
      hasLoggedOut.current = true;
      void logout();
    }
    navigate("/", { replace: true });
  }, [logout, navigate]);

  return (
    <div className="d-flex justify-content-center py-5">
      <Spinner />
    </div>
  );
}
