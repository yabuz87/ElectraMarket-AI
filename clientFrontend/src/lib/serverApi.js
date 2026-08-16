const apiUrl = () =>
  (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500").replace(/\/$/, "");

const readJson = async (path, revalidate = 60) => {
  try {
    const response = await fetch(`${apiUrl()}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

export const getInitialCatalog = async () => {
  const [catalog, categoryData] = await Promise.all([
    readJson("/product/filterProducts?page=1&limit=8&sort=newest", 60),
    readJson("/product/categories", 300),
  ]);
  return {
    products: catalog?.products || [],
    total: Number(catalog?.total) || 0,
    categories: categoryData?.categories || [],
  };
};

export const getProduct = (id) =>
  readJson(`/product/findOneProduct/${encodeURIComponent(id)}`, 60);

export const getAllProductsForSitemap = async () => {
  const result = await readJson("/product/allProducts", 300);
  return Array.isArray(result) ? result : result?.products || [];
};
