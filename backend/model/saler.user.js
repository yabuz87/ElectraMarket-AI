import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true, trim: true },
    address: { type: String, trim: true, default: "" },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    profileImage: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Saler", sellerSchema);
