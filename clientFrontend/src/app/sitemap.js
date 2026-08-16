import { getAllProductsForSitemap } from "../lib/serverApi";

export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const products = await getAllProductsForSitemap();
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: .5 },
    ...products.map((product) => ({ url: `${siteUrl}/products/${product._id}`, lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(), changeFrequency: "weekly", priority: .8 })),
  ];
}
