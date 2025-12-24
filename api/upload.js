// api/upload.js
const { v2: cloudinary } = require("cloudinary");

function parseCloudinaryUrl(cloudinaryUrl) {
  // cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  if (!cloudinaryUrl) return null;
  try {
    const url = new URL(cloudinaryUrl);
    const cloudName = url.hostname;
    const [apiKey, apiSecret] = decodeURIComponent(url.username + ":" + url.password).split(":");
    return { cloudName, apiKey, apiSecret };
  } catch (e) {
    return null;
  }
}

module.exports = async (req, res) => {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Ensure Cloudinary env exists
    const cfg = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (!cfg || !cfg.cloudName || !cfg.apiKey || !cfg.apiSecret) {
      return res.status(500).json({
        error: "Cloudinary is not configured. Missing/invalid CLOUDINARY_URL in Vercel env.",
      });
    }

    cloudinary.config({
      cloud_name: cfg.cloudName,
      api_key: cfg.apiKey,
      api_secret: cfg.apiSecret,
      secure: true,
    });

    // Vercel usually parses JSON, but keep this safe:
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const imageBase64 = body?.imageBase64;
    const folder = body?.folder || "talevers/uploads";

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageBase64, {
      folder,
      resource_type: "image",
    });

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
      folder: result.folder || folder,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Upload failed",
      details: err?.message || String(err),
    });
  }
};
