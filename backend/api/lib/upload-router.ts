/**
 * Cloudinary upload router.
 *
 * Security:
 *  - ALL endpoints require a valid access token (Bearer header).
 *  - The proxy upload (POST /) and the direct-upload signature (GET /signature)
 *    additionally require an authenticated, non-suspended user.
 *  - DELETE /:publicId requires the user to be an instructor or admin
 *    (students cannot delete course assets).
 */
import { Hono } from "hono";
import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";
import { logger } from "./logger";
import { verifyAccessToken } from "./auth";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
];

const MAX_PROXY_SIZE = 100 * 1024 * 1024; // 100MB — proxy upload for small files
const MAX_DIRECT_SIZE = 5 * 1024 * 1024 * 1024; // 5GB — direct upload for large files

const MIME_TYPE_TO_RESOURCE_TYPE: Record<string, string> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "application/pdf": "raw",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "video",
  "audio/wav": "video",
  "audio/ogg": "video",
};

export const uploadRouter = new Hono();

/** Extract and verify the Bearer access token. Returns the user row or null. */
async function getUserFromRequest(c: any) {
  const authHeader = c.req.header("Authorization") || c.req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    if (!payload?.userId) return null;
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(payload.userId)))
      .limit(1);
    if (!user || user.isSuspended) return null;
    return user;
  } catch {
    return null;
  }
}

function unauthorized(c: any) {
  return c.json({ error: "Authentication required" }, 401);
}

// Auth middleware for all upload routes
uploadRouter.use("*", async (c, next) => {
  const user = await getUserFromRequest(c);
  if (!user) return unauthorized(c);
  c.set("user", user);
  await next();
});

// Proxy upload — for smaller files, goes through our server
uploadRouter.post("/", async (c) => {
  if (!env.cloudinaryUrl) {
    return c.json({ error: "Cloudinary is not configured" }, 503);
  }

  cloudinary.config({ secure: true });

  const body = await c.req.parseBody();
  const file = body["file"];
  const folder = (body["folder"] as string) || "general";

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  if (file.size > MAX_PROXY_SIZE) {
    return c.json({ error: "File too large. Use direct upload instead.", maxSize: MAX_PROXY_SIZE }, 413);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return c.json({ error: `File type ${file.type} is not allowed` }, 415);
  }

  const sanitizedFilename = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 255);

  const resourceType = MIME_TYPE_TO_RESOURCE_TYPE[file.type] || "auto";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `pacemaker/${folder}`,
          resource_type: resourceType as any,
          allowed_formats: ["jpg", "png", "webp", "gif", "pdf", "mp4", "webm", "mov", "mp3", "wav", "ogg"],
          quality: "auto",
          fetch_format: "auto",
          overwrite: false,
          unique_filename: true,
          public_id: sanitizedFilename.replace(/\.[^/.]+$/, ""),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    logger.info("File uploaded via proxy", { publicId: uploadResult.public_id, type: file.type, size: file.size });

    return c.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err: any) {
    logger.error("Upload failed", { error: err.message, filename: file.name });
    return c.json({ error: "File upload failed" }, 500);
  }
});

// Direct upload signature — browser uploads directly to Cloudinary (bypasses our server)
// Supports files up to 5GB — suitable for long videos
uploadRouter.get("/signature", async (c) => {
  if (!env.cloudinaryUrl) {
    return c.json({ error: "Cloudinary is not configured" }, 503);
  }

  const folder = c.req.query("folder") || "general";
  const timestamp = Math.round(Date.now() / 1000);

  cloudinary.config({ secure: true });

  const params: Record<string, any> = {
    timestamp,
    folder: `pacemaker/${folder}`,
    unique_filename: true,
    overwrite: false,
  };

  // Generate signature
  const signature = cloudinary.utils.api_sign_request(params, cloudinary.config().api_secret!);

  return c.json({
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
    signature,
    timestamp,
    folder: `pacemaker/${folder}`,
    maxFileSize: MAX_DIRECT_SIZE,
  });
});

uploadRouter.delete("/:publicId", async (c) => {
  if (!env.cloudinaryUrl) {
    return c.json({ error: "Cloudinary is not configured" }, 503);
  }

  const user = c.get("user");
  // Only instructors and admins can delete assets
  if (user.role !== "instructor" && user.role !== "admin") {
    return c.json({ error: "Insufficient permissions to delete assets" }, 403);
  }

  const publicId = c.req.param("publicId");

  if (!/^[a-zA-Z0-9_/]+$/.test(publicId)) {
    return c.json({ error: "Invalid public ID format" }, 400);
  }

  cloudinary.config({ secure: true });

  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info("File deleted from cloudinary", { publicId, userId: user.id });
    return c.json({ success: true });
  } catch (err: any) {
    logger.error("Delete failed", { error: err.message, publicId });
    return c.json({ error: "Failed to delete file" }, 500);
  }
});
