const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const SETTINGS_FILE = path.join(__dirname, "settings.json");

// Read settings
function readSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { upiId: "yourupi@bank", name: "MDS Billing" };
  }
}

// Write settings
function writeSettings(settings) {
  fs.writeFileSync(
    SETTINGS_FILE,
    JSON.stringify(settings, null, 2),
    "utf-8"
  );
}

// ROOT route (fix for "Cannot GET /")
app.get("/", (req, res) => {
  res.send("MDS Billing UPI Server is running 🚀");
});

// GET settings
app.get("/admin/settings", (req, res) => {
  try {
    const settings = readSettings();
    res.json(settings);
  } catch {
    res.status(500).json({ error: "Failed to read settings" });
  }
});

// UPDATE settings
app.post("/admin/settings", (req, res) => {
  const { upiId, name } = req.body;

  if (typeof upiId !== "string" || !upiId.includes("@")) {
    return res.status(400).json({
      error: "Invalid UPI ID (example: yourname@okaxis)",
    });
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const settings = {
      upiId: upiId.trim(),
      name: name.trim(),
    };

    writeSettings(settings);

    res.json({
      success: true,
      message: "UPI settings updated",
      settings,
    });
  } catch {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// GENERATE QR
app.post("/generate-qr", async (req, res) => {
  const { amount } = req.body;

  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      error: "Invalid amount (must be positive number)",
    });
  }

  try {
    const settings = readSettings();

    const upiLink = `upi://pay?pa=${encodeURIComponent(
      settings.upiId
    )}&pn=${encodeURIComponent(settings.name)}&am=${parsedAmount.toFixed(
      2
    )}&cu=INR`;

    const qr = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });

    res.json({
      success: true,
      qr,
      upiLink,
    });
  } catch {
    res.status(500).json({ error: "QR generation failed" });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});