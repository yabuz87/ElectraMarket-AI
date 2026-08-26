import mongoose from "mongoose";

const productVisitSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElecrtonicsProduct",
      required: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
      index: true,
    },
    viewCount: { type: Number, default: 1, min: 1 },
    lastViewedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

productVisitSchema.index({ buyerId: 1, productId: 1 }, { unique: true });
productVisitSchema.index({ buyerId: 1, lastViewedAt: -1 });

export default mongoose.model("ProductVisit", productVisitSchema);
