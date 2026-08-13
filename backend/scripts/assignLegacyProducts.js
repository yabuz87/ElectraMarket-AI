import "dotenv/config";
import mongoose from "mongoose";
import connect from "../lib/mongodb.js";
import electronicsProduct from "../model/electronics.product.js";
import Saler from "../model/saler.user.js";

const sellerEmail = process.argv.find((argument) => argument.startsWith("--seller-email="))?.split("=").slice(1).join("=").trim().toLowerCase();
const apply = process.argv.includes("--apply");

if (!sellerEmail) {
  console.error("Usage: npm run migrate:legacy-owner -- --seller-email=owner@example.com [--apply]");
  process.exitCode = 1;
} else {
  try {
    await connect();
    const seller = await Saler.findOne({ email: sellerEmail }).select("_id fullName email").lean();
    if (!seller) throw new Error(`No seller account found for ${sellerEmail}`);
    const contactReady = await Saler.exists({
      _id: seller._id,
      fullName: { $nin: [null, ""] },
      phone: { $nin: [null, ""] },
      address: { $nin: [null, ""] },
    });
    if (!contactReady) throw new Error("Complete the seller's name, phone, and address before assigning public listings");

    const filter = { $or: [{ salerId: { $exists: false } }, { salerId: null }] };
    const count = await electronicsProduct.countDocuments(filter);
    if (!apply) {
      console.log(`Dry run: ${count} legacy products can be assigned to ${seller.fullName} (${seller.email}). Add --apply to update them.`);
    } else {
      const result = await electronicsProduct.updateMany(filter, { $set: { salerId: seller._id } });
      console.log(`Assigned ${result.modifiedCount} legacy products to ${seller.fullName} (${seller.email}).`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
