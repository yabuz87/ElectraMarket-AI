import { Bot, PackageCheck, ShoppingBag, Smartphone, Truck } from "lucide-react";

const benefits = [
  [ShoppingBag, "A locally focused e-commerce experience"],
  [Smartphone, "A growing selection of trusted technology"],
  [Truck, "Flexible delivery and pickup options"],
  [Bot, "Shopping support through our smart assistant"],
  [PackageCheck, "Clear product details from local sellers"],
];

export default function About() {
  return (
    <main className="about-page container">
      <header className="about-heading"><span className="eyebrow">Our story</span><h1>Technology shopping,<br />made for Ethiopia.</h1><p>ElectraStore connects shoppers with electronics through a clear catalog, secure accounts, and helpful AI-assisted discovery.</p></header>
      <div className="about-grid">
        <img src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85" alt="A selection of modern smartphones" />
        <section>
          <h2>Built around the customer</h2>
          <p>We are a team of technology enthusiasts creating a smoother way to discover and buy electronics. Our goal is to make product information easier to understand and the shopping journey more dependable.</p>
          <div className="about-benefits">{benefits.map(([Icon, text]) => <div key={text}><span><Icon size={19} /></span><strong>{text}</strong></div>)}</div>
          <h2>Our vision</h2>
          <p>To become Ethiopia’s most customer-focused technology marketplace—where people can browse, compare, and buy with confidence.</p>
        </section>
      </div>
    </main>
  );
}
