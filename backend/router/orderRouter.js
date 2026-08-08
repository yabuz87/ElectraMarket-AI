import express from "express";
import { cancelOrder, changeOrderStatus, createOrder, getAllOrder, getOrderDetails } from "../controller/orderController.js";
import { protectBuyerRoute } from "../middleware/authBuyermiddleware.js";
import { protectSalerRoute } from "../middleware/authSalermiddleware.js";

const orderRouter = express.Router();

orderRouter.get("/all", protectSalerRoute, getAllOrder);
orderRouter.post("/create", protectBuyerRoute, createOrder);
orderRouter.put("/status", protectSalerRoute, changeOrderStatus);
orderRouter.patch("/cancel/:id", protectBuyerRoute, cancelOrder);
orderRouter.get("/:id", protectBuyerRoute, getOrderDetails);

export default orderRouter;
