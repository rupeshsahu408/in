import { Router } from "express";
import multer from "multer";
import { type AuthedRequest, requireAuth } from "../auth";
import {
  getCloudinaryConfig,
  isCloudinaryReady,
  signUploadParams,
  uploadBuffer,
} from "../cloudinary";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.get("/config", (_req, res) => {
  res.json({ ...getCloudinaryConfig(), ready: isCloudinaryReady() });
});

router.post("/sign", requireAuth, (req, res) => {
  if (!isCloudinaryReady())
    return res.status(503).json({ error: "Cloudinary not configured" });
  const { folder = "instaclone" } = req.body || {};
  try {
    const result = signUploadParams({ folder });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Server-side upload fallback (proxies to Cloudinary, or stores as data URL if not configured — DEV ONLY)
router.post("/", requireAuth, upload.single("file"), async (req: AuthedRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  if (isCloudinaryReady()) {
    try {
      const result = await uploadBuffer(req.file.buffer);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  // Dev fallback: data URL (do not use in production!)
  const b64 = req.file.buffer.toString("base64");
  const url = `data:${req.file.mimetype};base64,${b64}`;
  res.json({ url, type: req.file.mimetype.startsWith("video") ? "video" : "image" });
});

export default router;
