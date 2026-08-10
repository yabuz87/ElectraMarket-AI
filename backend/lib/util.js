import jwt from "jsonwebtoken";

export const generateToken = (userId, role, res) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  const cookieName = role === "seller" ? "sellerJwt" : "buyerJwt";
  res.cookie(cookieName, token, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
};
