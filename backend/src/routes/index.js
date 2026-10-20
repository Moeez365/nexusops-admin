import express from "express";
import uploadRouter from "./upload.js";
import productsRouter from "./products.js";
import collectionsRouter from "./collections.js";
import ordersRouter from "./orders.js";
import settingsRouter from "./settings.js";
import { checkCountry } from "../middleware/checkCountry.js";

const router = express.Router();

router.get("/", checkCountry, (req, res) => {
  res.send({
    message: "API is ready",
    detectedCountry: req.country,
    clientIp: req.clientIp,
  });
});

router.use("/upload", uploadRouter);
router.use("/products", productsRouter);
router.use("/collections", collectionsRouter);
router.use("/orders", ordersRouter);
router.use("/settings", settingsRouter);

export default router;
