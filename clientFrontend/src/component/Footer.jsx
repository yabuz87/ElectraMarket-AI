import Link from "next/link";
import { Mail, MessageCircle, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="store-footer">
      <div className="container store-footer__grid">
        <div><Link className="brand brand--footer" href="/"><span><Zap size={20} fill="currentColor" /></span>ElectraMarket</Link><p>Discover products, compare details, and connect directly with their owners.</p></div>
        <div><strong>Explore</strong><Link href="/">Browse listings</Link><Link href="/about">About us</Link></div>
        <div><strong>Marketplace help</strong><span><MessageCircle size={16} /> Contact owners from each listing</span><span><Mail size={16} /> Ask our discovery assistant</span></div>
      </div>
      <div className="container store-footer__bottom"><span>© {new Date().getFullYear()} ElectraMarket AI</span><span>A product-discovery marketplace.</span></div>
    </footer>
  );
}
