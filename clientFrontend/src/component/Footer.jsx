import { Link } from "react-router-dom";
import { Mail, ShieldCheck, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="store-footer">
      <div className="container store-footer__grid">
        <div><Link className="brand brand--footer" to="/"><span><Zap size={20} fill="currentColor" /></span>ElectraStore</Link><p>Technology shopping made simpler, clearer, and more personal.</p></div>
        <div><strong>Explore</strong><Link to="/">Shop products</Link><Link to="/about">About us</Link><Link to="/orders">My orders</Link></div>
        <div><strong>Customer care</strong><span><ShieldCheck size={16} /> Secure account experience</span><span><Mail size={16} /> Help through our assistant</span></div>
      </div>
      <div className="container store-footer__bottom"><span>© {new Date().getFullYear()} ElectraStore</span><span>Designed for confident shopping.</span></div>
    </footer>
  );
}
