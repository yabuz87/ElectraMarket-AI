import express from "express";
import { filterProducts, findOneProduct, getAllProducts, getProductCategories, getProductLikeStatus, searchProduct, toggleProductLike } from "../controller/productController.js";
import { protectBuyerRoute } from "../middleware/authBuyermiddleware.js";
import { createProductComment, deleteProductComment, getProductComments } from "../controller/productCommentController.js";

const productRouter = express.Router();

productRouter.get("/allProducts", getAllProducts);
productRouter.get("/searchProduct", searchProduct);
productRouter.get("/filterProducts", filterProducts);
productRouter.get("/categories", getProductCategories);
productRouter.get("/comments/:productId", getProductComments);
productRouter.post("/comments/:productId", protectBuyerRoute, createProductComment);
productRouter.delete("/comments/:productId/:commentId", protectBuyerRoute, deleteProductComment);
productRouter.get("/like/:id", protectBuyerRoute, getProductLikeStatus);
productRouter.put("/like/:id", protectBuyerRoute, toggleProductLike);
productRouter.get("/findOneProduct/:id", findOneProduct);

export default productRouter;
