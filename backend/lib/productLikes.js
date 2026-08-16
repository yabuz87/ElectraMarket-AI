import electronicsProduct from "../model/electronics.product.js";
import ProductLike from "../model/productLike.model.js";
import { publishProductEvent } from "./productEvents.js";

const migrateLegacyLikes = async (product) => {
  const legacyUsers = product.likes?.users || [];
  if (legacyUsers.length) {
    await ProductLike.bulkWrite(
      legacyUsers.map((buyerId) => ({
        updateOne: {
          filter: { productId: product._id, buyerId },
          update: { $setOnInsert: { productId: product._id, buyerId } },
          upsert: true,
        },
      })),
      { ordered: false }
    );
    await electronicsProduct.updateOne({ _id: product._id }, { $unset: { "likes.users": "" } });
  }
};

const synchronizeCount = async (productId) => {
  const count = await ProductLike.countDocuments({ productId });
  await electronicsProduct.updateOne({ _id: productId }, { $set: { "likes.count": count } });
  return count;
};

const loadProduct = async (productId) => {
  const product = await electronicsProduct.findById(productId).select("name likes").lean();
  if (!product) return null;
  await migrateLegacyLikes(product);
  return product;
};

export const getProductLikeState = async (productId, buyerId) => {
  const product = await loadProduct(productId);
  if (!product) return null;
  const [liked, count] = await Promise.all([
    ProductLike.exists({ productId, buyerId }),
    synchronizeCount(productId),
  ]);
  return { product, liked: Boolean(liked), count };
};

export const setProductLikeState = async (productId, buyerId, liked) => {
  const product = await loadProduct(productId);
  if (!product) return null;
  if (liked) {
    await ProductLike.updateOne(
      { productId, buyerId },
      { $setOnInsert: { productId, buyerId } },
      { upsert: true }
    );
  } else {
    await ProductLike.deleteOne({ productId, buyerId });
  }
  const count = await synchronizeCount(productId);
  const result = { product, liked: Boolean(liked), count };
  publishProductEvent(productId, "like.updated", { count });
  return result;
};

export const toggleProductLikeState = async (productId, buyerId) => {
  const current = await getProductLikeState(productId, buyerId);
  if (!current) return null;
  return setProductLikeState(productId, buyerId, !current.liked);
};
