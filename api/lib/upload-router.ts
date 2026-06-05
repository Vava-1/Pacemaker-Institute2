import { Hono } from "hono";
import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

export const uploadRouter = new Hono();

uploadRouter.post("/", async (c) => {
  if (!env.cloudinaryUrl) {
    return c.json({ error: "Cloudinary is not configured" }, 500);
  }

  // Set cloudinary config from URL
  cloudinary.config({
    secure: true,
  });

  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "pacemaker-institute" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return c.json({ url: (uploadResult as any).secure_url });
  } catch (err: any) {
    console.error("Upload Error:", err);
    return c.json({ error: "File upload failed" }, 500);
  }
});
