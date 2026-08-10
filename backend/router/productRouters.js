import express from "express";
import { filterProducts, findOneProduct, getAllProducts, getProductLikeStatus, searchProduct, toggleProductLike } from "../controller/productController.js";
import { protectBuyerRoute } from "../middleware/authBuyermiddleware.js";

const productRouter = express.Router();

productRouter.get("/allProducts", getAllProducts);
productRouter.get("/searchProduct", searchProduct);
productRouter.get("/filterProducts", filterProducts);
productRouter.get("/like/:id", protectBuyerRoute, getProductLikeStatus);
productRouter.put("/like/:id", protectBuyerRoute, toggleProductLike);
productRouter.get("/findOneProduct/:id", findOneProduct);

export default productRouter;
