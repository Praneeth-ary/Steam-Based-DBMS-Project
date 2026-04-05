import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const coversDir = path.join(__dirname, "..", "..", "uploads", "covers");

export function ensureCoversDir() {
  fs.mkdirSync(coversDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureCoversDir();
    cb(null, coversDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safe = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
    cb(null, safe);
  },
});

const imageMime = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const uploadGameCover = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (imageMime.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed"));
  },
});
