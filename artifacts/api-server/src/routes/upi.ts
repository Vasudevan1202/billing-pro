import { Router, type IRouter } from "express";
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Resolve settings.json path relative to the compiled bundle (dist/index.mjs)
// __dirname → artifacts/api-server/dist/  →  ../settings.json = artifacts/api-server/settings.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = join(__dirname, "../settings.json");

interface UpiSettings {
  upiId: string;
  name: string;
}

async function readSettings(): Promise<UpiSettings> {
  const raw = await readFile(SETTINGS_FILE, "utf-8");
  return JSON.parse(raw) as UpiSettings;
}

async function writeSettings(settings: UpiSettings): Promise<void> {
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

// GET /admin/settings — return current UPI settings
router.get("/admin/settings", async (req, res): Promise<void> => {
  try {
    const settings = await readSettings();
    res.json(settings);
  } catch (err) {
    req.log.error({ err }, "Failed to read settings");
    res.status(500).json({ error: "Failed to read settings" });
  }
});

// POST /admin/settings — update UPI ID and name
router.post("/admin/settings", async (req, res): Promise<void> => {
  const { upiId, name } = req.body as { upiId?: unknown; name?: unknown };

  if (typeof upiId !== "string" || !upiId.includes("@")) {
    res.status(400).json({ error: "Invalid UPI ID. Must include '@' (e.g. yourname@bank)" });
    return;
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    const settings: UpiSettings = { upiId: upiId.trim(), name: name.trim() };
    await writeSettings(settings);
    req.log.info({ upiId: settings.upiId }, "UPI settings updated");
    res.json({ success: true, message: "UPI settings updated successfully", settings });
  } catch (err) {
    req.log.error({ err }, "Failed to save settings");
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// POST /generate-qr — generate UPI payment QR code for a given amount
router.post("/generate-qr", async (req, res): Promise<void> => {
  const { amount } = req.body as { amount?: unknown };

  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: "Invalid amount. Must be a positive number." });
    return;
  }

  try {
    const settings = await readSettings();
    const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.name)}&am=${parsedAmount.toFixed(2)}&cu=INR`;

    const qrBase64 = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });

    res.json({
      success: true,
      qr: qrBase64,
      upiLink,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate QR code");
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

export default router;
