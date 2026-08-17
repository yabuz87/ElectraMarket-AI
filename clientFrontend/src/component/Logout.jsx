"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";
import { useAuthStore } from "../store/useAuthStore";

export default function Logout() {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (!hasLoggedOut.current) {
      hasLoggedOut.current = true;
      void logout();
    }
    router.replace("/");
  }, [logout, router]);

  return (
    <div className="d-flex justify-content-center py-5">
      <Spinner />
    </div>
  );
}
