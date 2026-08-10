import express from "express";
import { check, login, logout, resendVerification, signup, verifyEmail } from "../controller/buyerController.js";
import { protectBuyerRoute } from "../middleware/authBuyermiddleware.js";

const buyerRouter = express.Router();

buyerRouter.post("/signup", signup);
buyerRouter.post("/login", login);
buyerRouter.post("/logout", logout);
buyerRouter.get("/verify-email", verifyEmail);
buyerRouter.post("/resend-verification", resendVerification);
buyerRouter.get("/check", protectBuyerRoute, check);

export default buyerRouter;
