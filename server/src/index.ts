import express from "express";
import cors from "cors";
import { prisma } from "./db.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ status: "ok", database: "connected", userCount });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
