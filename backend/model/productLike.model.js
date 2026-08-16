import mongoose from "mongoose";

const productLikeSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "ElecrtonicsProduct", required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true, index: true },
  },
  { timestamps: true }
);

productLikeSchema.index({ productId: 1, buyerId: 1 }, { unique: true });
productLikeSchema.index({ buyerId: 1, createdAt: -1 });

export default mongoose.model("ProductLike", productLikeSchema);
