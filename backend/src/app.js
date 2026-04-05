import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { ensureCoversDir } from "./middleware/uploadGameCover.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import developerRoutes from "./routes/developerRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";

const app = express();

const origin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
app.use(
  cors({
    origin,
    credentials: true,
  })
);
app.use(express.json());
ensureCoversDir();
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    maxAge: "7d",
    fallthrough: true,
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "gdps-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/debug", debugRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;
