export const revalidateFrontend = (productId) => {
  const url = process.env.FRONTEND_REVALIDATE_URL?.trim();
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!url || !secret) return;
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Revalidate-Secret": secret },
    body: JSON.stringify(productId ? { productId: String(productId) } : {}),
    signal: AbortSignal.timeout(5_000),
  }).then((response) => {
    if (!response.ok) console.warn(`Frontend revalidation failed (${response.status})`);
  }).catch((error) => console.warn("Frontend revalidation skipped:", error.message));
};
