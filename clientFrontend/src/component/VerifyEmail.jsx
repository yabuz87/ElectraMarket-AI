import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { axiosInstance } from "../utils";
import Spinner from "./Spinner";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, success: false, message: "" });

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) {
      setState({ loading: false, success: false, message: "This verification link is incomplete." });
      return;
    }

    let active = true;
    axiosInstance
      .get("/buyer/verify-email", { params: { token, email } })
      .then((response) => {
        if (active) setState({ loading: false, success: true, message: response.data.message });
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            success: false,
            message: error.response?.data?.message || "This verification link is invalid or expired.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  return (
    <main className="container my-5 text-center" style={{ maxWidth: 560 }}>
      {state.loading ? (
        <Spinner />
      ) : (
        <>
          <h1 className={`h3 ${state.success ? "text-success" : "text-danger"}`}>
            {state.success ? "Email verified" : "Verification failed"}
          </h1>
          <p className="mt-3">{state.message}</p>
          <Link className="btn btn-primary" to="/login">
            Go to login
          </Link>
        </>
      )}
    </main>
  );
}
