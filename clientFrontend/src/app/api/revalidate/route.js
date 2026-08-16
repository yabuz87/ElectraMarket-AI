import { revalidatePath } from "next/cache";

export async function POST(request) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || request.headers.get("x-revalidate-secret") !== expected) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (body.productId) revalidatePath(`/products/${body.productId}`);
  return Response.json({ revalidated: true, now: Date.now() });
}
