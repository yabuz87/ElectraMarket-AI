import express from "express";
import { filterProducts, findOneProduct, getAllProducts, searchProduct } from "../controller/productController.js";

const productRouter = express.Router();

productRouter.get("/allProducts", getAllProducts);
productRouter.get("/searchProduct", searchProduct);
productRouter.get("/filterProducts", filterProducts);
productRouter.get("/findOneProduct/:id", findOneProduct);

export default productRouter;
