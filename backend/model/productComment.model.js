import mongoose from "mongoose";

const productCommentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElecrtonicsProduct",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

productCommentSchema.index({ productId: 1, createdAt: -1 });

export default mongoose.model("ProductComment", productCommentSchema);
