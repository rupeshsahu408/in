import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    firebase: {
      apiKey: process.env.VITE_FIREBASE_API_KEY || "",
      authDomain:
        process.env.VITE_FIREBASE_AUTH_DOMAIN ||
        (process.env.VITE_FIREBASE_PROJECT_ID
          ? `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
          : ""),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
      appId: process.env.VITE_FIREBASE_APP_ID || "",
      storageBucket:
        process.env.VITE_FIREBASE_STORAGE_BUCKET ||
        (process.env.VITE_FIREBASE_PROJECT_ID
          ? `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`
          : ""),
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      configured: Boolean(
        process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID
      ),
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "",
      configured: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
      ),
    },
  });
});

export default router;
