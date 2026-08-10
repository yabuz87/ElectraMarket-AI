import jwt from "jsonwebtoken";
import Saler from "../model/saler.user.js";

export const protectSalerRoute = async (req, res, next) => {
  try {
    const token = req.cookies.sellerJwt || req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role && decoded.role !== "seller") {
      return res.status(403).json({ message: "Seller access required" });
    }

    const user = await Saler.findById(decoded.userId).select("-password").lean();
    if (!user) {
      return res.status(401).json({ message: "Seller account not found" });
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
