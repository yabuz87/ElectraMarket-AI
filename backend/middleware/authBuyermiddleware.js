import jwt from "jsonwebtoken";
import Buyer from "../model/buyer.user.js";

export const protectBuyerRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role && decoded.role !== "buyer") {
      return res.status(403).json({ message: "Buyer access required" });
    }

    const user = await Buyer.findById(decoded.userId).select("-password").lean();
    if (!user) {
      return res.status(401).json({ message: "User account not found" });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    return next(error);
  }
};
