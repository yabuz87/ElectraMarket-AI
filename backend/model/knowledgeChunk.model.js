import mongoose from "mongoose";

const knowledgeChunkSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ["product", "faq", "policy"],
      required: true,
      index: true,
    },
    sourceId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true, select: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    embeddingModel: { type: String, required: true },
    contentHash: { type: String, required: true },
  },
  { timestamps: true }
);

knowledgeChunkSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

export default mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
