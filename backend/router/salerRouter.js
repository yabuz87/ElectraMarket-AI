import express from "express";
import { addProduct, check, deleteProduct, editProduct, getOwnProducts, login, logout, signup, updateProfile } from "../controller/salerController.js";
import { protectSalerRoute } from "../middleware/authSalermiddleware.js";

const salerRouter = express.Router();

salerRouter.post("/signup", signup);
salerRouter.post("/login", login);
salerRouter.post("/logout", logout);
salerRouter.get("/check", protectSalerRoute, check);
salerRouter.put("/profile", protectSalerRoute, updateProfile);
salerRouter.get("/products", protectSalerRoute, getOwnProducts);
salerRouter.post("/addProduct", protectSalerRoute, addProduct);
salerRouter.put("/edit/:id", protectSalerRoute, editProduct);
salerRouter.delete("/deleteProduct/:id", protectSalerRoute, deleteProduct);

export default salerRouter;
