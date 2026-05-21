import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { authMiddleware } from "./auth";
import usersRouter from "./routes/users";
import postsRouter from "./routes/posts";
import storiesRouter from "./routes/stories";
import notificationsRouter from "./routes/notifications";
import messagesRouter from "./routes/messages";
import uploadRouter from "./routes/upload";
import configRouter from "./routes/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (configuredOrigins.length === 0) return cb(null, true);
      if (configuredOrigins.includes(origin)) return cb(null, true);
      if (/\.vercel\.app$/.test(origin) || /\.onrender\.com$/.test(origin))
        return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(authMiddleware);

app.use("/api/config", configRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/stories", storiesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/upload", uploadRouter);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = Number(process.env.PORT || 5000);

async function start() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "public");
    app.use(express.static(distPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      root: path.resolve(process.cwd(), "client"),
      server: { middlewareMode: true, host: "0.0.0.0", allowedHosts: true, hmr: { server: undefined } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((e) => {
  console.error("Fatal startup error:", e);
  process.exit(1);
});
