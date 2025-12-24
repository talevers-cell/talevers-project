import { v2 as cloudinary } from "cloudinary";

cloudinary.config({ secure: true });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, folder = "talevers/uploads" } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const result = await cloudinary.uploader.upload(imageBase64, {
      folder,
    });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
}
