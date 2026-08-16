import { Suspense } from "react";
import VerifyEmail from "../../component/VerifyEmail";
import Spinner from "../../component/Spinner";
export const metadata = { title: "Verify email", robots: { index: false } };
export default function VerifyEmailPage() { return <Suspense fallback={<div className="py-5 text-center"><Spinner /></div>}><VerifyEmail /></Suspense>; }
