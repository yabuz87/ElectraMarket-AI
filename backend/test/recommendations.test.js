import test from "node:test";
import assert from "node:assert/strict";
import { rankRecommendations } from "../lib/recommendations.js";

const now = Date.parse("2026-08-27T12:00:00.000Z");
const product = (id, category, price, views, likes = 0) => ({
  _id: id,
  name: `${category} ${id}`,
  model: id,
  category,
  price,
  views: { count: views },
  likes: { count: likes },
  createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
});

test("new visitors receive the most-viewed products first", () => {
  const products = [product("low", "Phone", 1000, 2), product("high", "Laptop", 5000, 100)];
  const result = rankRecommendations(products, [], { limit: 2, now });
  assert.equal(result.strategy, "popular");
  assert.equal(result.products[0]._id, "high");
});

test("past visits favor related categories and prices", () => {
  const visited = product("visited", "Phone", 3500, 5);
  const products = [
    visited,
    product("phone-match", "Phone", 3800, 3),
    product("unrelated-popular", "Laptop", 30000, 1000),
  ];
  const visits = [{ productId: visited, viewCount: 3, lastViewedAt: new Date(now) }];
  const result = rankRecommendations(products, visits, { limit: 3, now });
  assert.equal(result.strategy, "personalized");
  assert.equal(result.products[0]._id, "phone-match");
  assert.equal(result.basedOnVisits, 1);
});

test("recommendation limits are enforced", () => {
  const products = Array.from({ length: 20 }, (_, index) => product(String(index), "Phone", 1000 + index, index));
  assert.equal(rankRecommendations(products, [], { limit: 50, now }).products.length, 12);
});
