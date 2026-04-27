import { v2 as cloudinary } from "cloudinary";

let configured = false;
function configure() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export function getCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
  };
}

export function signUploadParams(params: Record<string, string | number>) {
  configure();
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = { timestamp, ...params };
  const signature = cloudinary.utils.api_sign_request(
    toSign,
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}

export async function uploadBuffer(buffer: Buffer, folder = "instaclone") {
  configure();
  return new Promise<{ url: string; type: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve({
          url: result.secure_url,
          type: result.resource_type === "video" ? "video" : "image",
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}

export function isCloudinaryReady() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}
