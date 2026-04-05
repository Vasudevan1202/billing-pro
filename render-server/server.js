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

function readSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { upiId: "yourupi@bank", name: "MDS Billing" };
  }
}

function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

// GET /admin/settings — return current UPI settings
app.get("/admin/settings", (req, res) => {
  try {
    const settings = readSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to read settings" });
  }
});

// POST /admin/settings — update UPI ID and name
app.post("/admin/settings", (req, res) => {
  const { upiId, name } = req.body;

  if (typeof upiId !== "string" || !upiId.includes("@")) {
    return res.status(400).json({ error: "Invalid UPI ID. Must include '@' (e.g. yourname@okaxis)" });
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const settings = { upiId: upiId.trim(), name: name.trim() };
    writeSettings(settings);
    res.json({ success: true, message: "UPI settings updated successfully", settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// POST /generate-qr — generate UPI payment QR code for a given amount
app.post("/generate-qr", async (req, res) => {
  const { amount } = req.body;

  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount. Must be a positive number." });
  }

  try {
    const settings = readSettings();
    const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.name)}&am=${parsedAmount.toFixed(2)}&cu=INR`;

    const qr = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });

    res.json({ success: true, qr, upiLink });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
