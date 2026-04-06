import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const bucket = process.env.S3_BUCKET;
const region = process.env.AWS_REGION;

const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp"];

if (!bucket) {
  throw new Error("S3_BUCKET is not set");
}
if (!region) {
  throw new Error("AWS_REGION is not set");
}

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "image file is required" });
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Only png, jpeg, webp files are allowed",
      });
    }

    const ext = path.extname(req.file.originalname || "").toLowerCase();
    const safeExt = ext || ".bin";
    const key = `uploads/${Date.now()}-${randomUUID()}${safeExt}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const objectUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return res.status(201).json({
      message: "upload success",
      key,
      url: objectUrl,
      contentType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error("S3 upload error:", error);
    return res.status(500).json({
      message: "upload failed",
    });
  }
});

export default router;