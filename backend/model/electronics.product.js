import mongoose from "mongoose";

const ElectronicsProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    salerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Saler",
      required: true,
      index: true,
    },
    spec: { type: Map, of: mongoose.Schema.Types.Mixed },
    productDate: { type: Date, default: Date.now },
    likes: {
      count: { type: Number, default: 0 },
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "Buyer" }],
    },
    views: {
      count: { type: Number, default: 0 },
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "Buyer" }],
    },
    image: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

ElectronicsProductSchema.index({ name: "text", model: "text", category: "text" });
ElectronicsProductSchema.index({ category: 1, price: 1 });

export default mongoose.model("ElecrtonicsProduct", ElectronicsProductSchema);
