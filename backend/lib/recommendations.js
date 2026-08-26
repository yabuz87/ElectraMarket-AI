const DAY_MS = 24 * 60 * 60 * 1000;

const normalizedText = (value) => String(value || "").trim().toLowerCase();

const productTokens = (product) => {
  const spec = product?.spec instanceof Map
    ? Object.fromEntries(product.spec)
    : (product?.spec || {});
  return new Set(
    [product?.name, product?.model, product?.category, ...Object.keys(spec), ...Object.values(spec)]
      .flatMap((value) => normalizedText(value).split(/[^a-z0-9]+/))
      .filter((token) => token.length > 1)
  );
};

const freshnessScore = (date, now) => {
  const ageDays = Math.max((now - new Date(date || 0).getTime()) / DAY_MS, 0);
  return Math.exp(-ageDays / 90);
};

const popularityScore = (product, maxima) => {
  const views = Math.log1p(Math.max(Number(product?.views?.count) || 0, 0));
  const likes = Math.log1p(Math.max(Number(product?.likes?.count) || 0, 0));
  const viewPart = maxima.views ? views / maxima.views : 0;
  const likePart = maxima.likes ? likes / maxima.likes : 0;
  return (viewPart * 0.7) + (likePart * 0.3);
};

const buildProfile = (visits, now) => {
  const categories = new Map();
  const tokens = new Map();
  const visitedIds = new Set();
  let weightedPrice = 0;
  let totalWeight = 0;

  for (const visit of visits) {
    const product = visit.productId;
    if (!product?._id) continue;
    const ageDays = Math.max((now - new Date(visit.lastViewedAt || visit.updatedAt || now).getTime()) / DAY_MS, 0);
    const frequency = 1 + Math.log1p(Math.max(Number(visit.viewCount) || 1, 1));
    const weight = frequency * Math.exp(-ageDays / 45);
    const category = normalizedText(product.category);

    visitedIds.add(String(product._id));
    if (category) categories.set(category, (categories.get(category) || 0) + weight);
    for (const token of productTokens(product)) {
      tokens.set(token, (tokens.get(token) || 0) + weight);
    }
    const price = Number(product.price);
    if (Number.isFinite(price) && price >= 0) weightedPrice += price * weight;
    totalWeight += weight;
  }

  const maxCategory = Math.max(0, ...categories.values());
  const maxToken = Math.max(0, ...tokens.values());
  return {
    categories,
    tokens,
    visitedIds,
    averagePrice: totalWeight ? weightedPrice / totalWeight : 0,
    maxCategory,
    maxToken,
  };
};

export const rankRecommendations = (products, visits = [], options = {}) => {
  const limit = Math.min(Math.max(Number(options.limit) || 8, 1), 12);
  const now = Number(options.now) || Date.now();
  const validProducts = products.filter((product) => product?._id);
  const maxima = {
    views: Math.max(0, ...validProducts.map((product) => Math.log1p(Math.max(Number(product.views?.count) || 0, 0)))),
    likes: Math.max(0, ...validProducts.map((product) => Math.log1p(Math.max(Number(product.likes?.count) || 0, 0)))),
  };
  const profile = buildProfile(visits, now);
  const personalized = profile.visitedIds.size > 0;

  const ranked = validProducts.map((product) => {
    const popularity = popularityScore(product, maxima);
    const freshness = freshnessScore(product.createdAt, now);
    if (!personalized) {
      return { product, score: (popularity * 0.85) + (freshness * 0.15) };
    }

    const category = normalizedText(product.category);
    const categoryAffinity = profile.maxCategory
      ? (profile.categories.get(category) || 0) / profile.maxCategory
      : 0;
    const candidateTokens = productTokens(product);
    const tokenAffinity = profile.maxToken && candidateTokens.size
      ? [...candidateTokens].reduce((sum, token) => sum + (profile.tokens.get(token) || 0) / profile.maxToken, 0) / candidateTokens.size
      : 0;
    const price = Number(product.price);
    const priceAffinity = profile.averagePrice > 0 && Number.isFinite(price)
      ? Math.exp(-Math.abs(price - profile.averagePrice) / Math.max(profile.averagePrice, 1))
      : 0;
    const alreadyViewed = profile.visitedIds.has(String(product._id));
    const novelty = alreadyViewed ? 0.72 : 1;
    const score = (
      (categoryAffinity * 0.36) +
      (tokenAffinity * 0.22) +
      (priceAffinity * 0.17) +
      (popularity * 0.15) +
      (freshness * 0.10)
    ) * novelty;
    return { product, score };
  });

  return {
    strategy: personalized ? "personalized" : "popular",
    products: ranked
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ product }) => product),
    basedOnVisits: profile.visitedIds.size,
  };
};
