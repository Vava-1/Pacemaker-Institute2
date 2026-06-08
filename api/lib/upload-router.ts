import { Hono } from "hono";
import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";
import { logger } from "./logger";

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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: "File exceeds maximum size of 50MB" }, 413);
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

    logger.info("File uploaded", { publicId: uploadResult.public_id, type: file.type });

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

uploadRouter.delete("/:publicId", async (c) => {
  if (!env.cloudinaryUrl) {
    return c.json({ error: "Cloudinary is not configured" }, 503);
  }

  const publicId = c.req.param("publicId");

  if (!/^[a-zA-Z0-9_/]+$/.test(publicId)) {
    return c.json({ error: "Invalid public ID format" }, 400);
  }

  cloudinary.config({ secure: true });

  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info("File deleted from cloudinary", { publicId });
    return c.json({ success: true });
  } catch (err: any) {
    logger.error("Delete failed", { error: err.message, publicId });
    return c.json({ error: "Failed to delete file" }, 500);
  }
});
