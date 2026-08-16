import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "../index.css";
import ClientNavbar from "../component/Navbar";
import Footer from "../component/Footer";
import AppProviders from "./providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ElectraMarket AI", template: "%s | ElectraMarket AI" },
  description: "Discover electronics listings in Ethiopia, compare product details, and contact verified product owners directly.",
  applicationName: "ElectraMarket AI",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ElectraMarket AI",
    title: "ElectraMarket AI",
    description: "A mobile-first electronics discovery marketplace powered by intelligent search.",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "ElectraMarket AI" },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#3157d5" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <ClientNavbar />
          <div className="site-content">{children}</div>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
