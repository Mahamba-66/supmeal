import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import passport from "./passport.js";
import { prisma } from "./db.js";
import { initSocket } from "./socket.js";
import authRoutes from "./routes/auth.routes.js";
import cookbookRoutes from "./routes/cookbook.routes.js";
import recipeRoutes from "./routes/recipe.routes.js";
import mealPlanRoutes from "./routes/mealplan.routes.js";
import dataRoutes from "./routes/data.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use("/uploads", express.static("uploads"));

app.use("/auth", authRoutes);
app.use("/cookbooks", cookbookRoutes);
app.use("/recipes", recipeRoutes);
app.use("/mealplans", mealPlanRoutes);
app.use("/data", dataRoutes);
app.use("/upload", uploadRoutes);

app.get("/health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ status: "ok", database: "connected", userCount });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

const httpServer = createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
