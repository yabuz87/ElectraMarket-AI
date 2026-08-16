import { notFound } from "next/navigation";
import ProductDetail from "../../../component/ProductDetail";
import { getProduct } from "../../../lib/serverApi";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const description = `${product.name}${product.model ? ` ${product.model}` : ""} listed for ${Number(product.price || 0).toLocaleString("en-US")} ETB. Contact the owner directly on ElectraMarket AI.`;
  const image = product.image?.find((item) => item?.url)?.url;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: { title: product.name, description, type: "website", images: image ? [{ url: image, alt: product.name }] : [] },
    twitter: { card: "summary_large_image", title: product.name, description, images: image ? [image] : [] },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const owner = product.salerId || {};
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    model: product.model,
    category: product.category,
    image: (product.image || []).map((item) => item?.url).filter(Boolean),
    offers: { "@type": "Offer", priceCurrency: "ETB", price: Number(product.price) || 0, availability: "https://schema.org/InStock", url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/products/${id}`, seller: { "@type": "Person", name: owner.fullName || "Product owner" } },
    aggregateRating: Number(owner.rating) > 0 ? { "@type": "AggregateRating", ratingValue: Number(owner.rating), bestRating: 5, ratingCount: 1 } : undefined,
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><ProductDetail productId={id} initialProduct={product} /></>;
}
