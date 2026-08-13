import { Bot, Contact, LayoutGrid, MessageCircle, Smartphone } from "lucide-react";

const benefits = [
  [LayoutGrid, "Public product listings for easy discovery"],
  [Smartphone, "A mobile-first experience for every screen"],
  [Contact, "Direct phone and location details from owners"],
  [MessageCircle, "Public comments and community feedback"],
  [Bot, "Product discovery through our smart assistant"],
];

export default function About() {
  return <main className="about-page container">
    <header className="about-heading"><span className="eyebrow">Our marketplace</span><h1>Technology discovery,<br />made for Ethiopia.</h1><p>ElectraStore helps people find electronics, understand each listing, and connect directly with product owners.</p></header>
    <div className="about-grid">
      <img src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85" alt="A selection of modern smartphones" />
      <section><h2>Built for clear connections</h2><p>ElectraStore is a non-transactional listing platform. We provide product information, owner contact details, community likes and comments, and shareable links. Buyers and owners arrange any transaction independently.</p><div className="about-benefits">{benefits.map(([Icon, text]) => <div key={text}><span><Icon size={19} /></span><strong>{text}</strong></div>)}</div><h2>Our vision</h2><p>To become Ethiopia’s clearest technology discovery marketplace—where anyone can browse, compare, share, and connect with confidence.</p></section>
    </div>
  </main>;
}
