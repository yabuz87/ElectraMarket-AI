import ProductShowcase from "../component/ProductShowcase";
import { getInitialCatalog } from "../lib/serverApi";

export const revalidate = 60;

export default async function HomePage() {
  const catalog = await getInitialCatalog();
  return <ProductShowcase initialCatalog={catalog} />;
}
