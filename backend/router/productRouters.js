import express from "express";
import { filterProducts, findOneProduct, getAllProducts, getProductCategories, getProductLikeStatus, getRecommendations, searchProduct, streamProductEvents, toggleProductLike, trackProductView } from "../controller/productController.js";
import { identifyBuyerIfPresent, protectBuyerRoute } from "../middleware/authBuyermiddleware.js";
import { createProductComment, deleteProductComment, getProductComments } from "../controller/productCommentController.js";

const productRouter = express.Router();

productRouter.get("/allProducts", getAllProducts);
productRouter.get("/searchProduct", searchProduct);
productRouter.get("/filterProducts", filterProducts);
productRouter.get("/categories", getProductCategories);
productRouter.get("/recommendations", identifyBuyerIfPresent, getRecommendations);
productRouter.get("/comments/:productId", getProductComments);
productRouter.get("/events/:productId", streamProductEvents);
productRouter.post("/comments/:productId", protectBuyerRoute, createProductComment);
productRouter.delete("/comments/:productId/:commentId", protectBuyerRoute, deleteProductComment);
productRouter.get("/like/:id", protectBuyerRoute, getProductLikeStatus);
productRouter.put("/like/:id", protectBuyerRoute, toggleProductLike);
productRouter.post("/view/:id", identifyBuyerIfPresent, trackProductView);
productRouter.get("/findOneProduct/:id", findOneProduct);

export default productRouter;
