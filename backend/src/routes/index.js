import express from "express";
import uploadRouter from "./upload.js";
import productsRouter from "./products.js";
import collectionsRouter from "./collections.js";
import ordersRouter from "./orders.js";
import settingsRouter from "./settings.js";
import usersRouter from "./users.js";
import analyticsRouter from "./analytics.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send({
    message: "API is ready",
  });
});

router.use("/upload", uploadRouter);
router.use("/products", productsRouter);
router.use("/collections", collectionsRouter);
router.use("/orders", ordersRouter);
router.use("/settings", settingsRouter);
router.use("/users", usersRouter);
router.use("/analytics", analyticsRouter);

export default router;
