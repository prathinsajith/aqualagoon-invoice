import type { Receipt } from "@/types/billing";
import { formatAmount } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";

/**
 * Bluetooth thermal-printer support via the Web Bluetooth API + ESC/POS.
 *
 * Works on Chrome/Edge (desktop) and Chrome on Android — anywhere Web Bluetooth
 * is available. iOS Safari/Chrome do NOT support Web Bluetooth (an Apple
 * limitation); callers should fall back to the browser print dialog there.
 */

// Minimal Web Bluetooth typings (DOM lib doesn't ship them everywhere).
interface BtCharacteristic {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValue(value: ArrayBufferView): Promise<void>;
  writeValueWithoutResponse?(value: ArrayBufferView): Promise<void>;
}
interface BtService {
  getCharacteristics(): Promise<BtCharacteristic[]>;
}
interface BtServer {
  connect(): Promise<BtServer>;
  getPrimaryServices(): Promise<BtService[]>;
}
interface BtDevice {
  gatt?: BtServer;
}
interface BtNavigator {
  bluetooth?: {
    requestDevice(opts: {
      acceptAllDevices?: boolean;
      optionalServices?: (string | number)[];
    }): Promise<BtDevice>;
  };
}

// Service UUIDs commonly exposed by cheap ESC/POS BLE printers + serial bridges.
const PRINTER_SERVICES: (string | number)[] = [
  0x18f0,
  0xff00,
  0xffe0,
  0xfff0,
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Microchip transparent UART
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART
];

const WIDTH = 32; // 58mm printers ≈ 32 chars per line.
const PRINTER_DOTS = 384; // 58mm @ 203dpi printable width (matches WIDTH).

/** A 1-bit raster image ready for the ESC/POS `GS v 0` command. */
interface Raster {
  bytesPerRow: number;
  height: number;
  data: Uint8Array;
}

/** True when the browser supports Web Bluetooth (not iOS Safari/Chrome). */
export function isThermalPrintingSupported(): boolean {
  return typeof navigator !== "undefined" && !!(navigator as unknown as BtNavigator).bluetooth;
}

// ---- ESC/POS byte builder ------------------------------------------------

class EscPos {
  private readonly bytes: number[] = [];
  raw(...b: number[]) {
    this.bytes.push(...b);
    return this;
  }
  /** Append text as ASCII (non-ASCII replaced with '?'). */
  text(s: string) {
    for (const ch of s) {
      const c = ch.charCodeAt(0);
      this.bytes.push(c < 128 ? c : 0x3f);
    }
    return this;
  }
  line(s = "") {
    return this.text(s).raw(0x0a);
  }
  init() {
    return this.raw(0x1b, 0x40);
  }
  align(a: "left" | "center" | "right") {
    return this.raw(0x1b, 0x61, a === "center" ? 1 : a === "right" ? 2 : 0);
  }
  bold(on: boolean) {
    return this.raw(0x1b, 0x45, on ? 1 : 0);
  }
  /** 0 = normal, 1 = double height+width. */
  size(big: boolean) {
    return this.raw(0x1d, 0x21, big ? 0x11 : 0x00);
  }
  feed(n = 1) {
    return this.raw(0x1b, 0x64, n);
  }
  cut() {
    return this.raw(0x1d, 0x56, 0x01);
  }
  /** Print a 1-bit raster bitmap (GS v 0, normal mode). */
  raster(r: Raster) {
    const xL = r.bytesPerRow & 0xff;
    const xH = (r.bytesPerRow >> 8) & 0xff;
    const yL = r.height & 0xff;
    const yH = (r.height >> 8) & 0xff;
    this.raw(0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH);
    for (const b of r.data) this.bytes.push(b);
    return this;
  }
  bytesArray(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

const sep = (ch = "-") => ch.repeat(WIDTH);

/** "left           right" padded to WIDTH (truncates left if needed). */
function lr(left: string, right: string): string {
  const space = WIDTH - right.length;
  const l = left.length > space - 1 ? left.slice(0, Math.max(0, space - 2)) + "…" : left;
  const pad = Math.max(1, WIDTH - l.length - right.length);
  return l + " ".repeat(pad) + right;
}

// ---- Logo rasterisation --------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // needed so the canvas isn't tainted (CORS)
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Logo image failed to load"));
    img.src = src;
  });
}

/**
 * Loads the company logo and converts it to a 1-bit raster centered on the
 * printer's full width. Best-effort: returns null if the image can't be loaded
 * or the canvas is cross-origin tainted, so the receipt still prints text-only.
 */
async function rasterizeLogo(url: string): Promise<Raster | null> {
  if (typeof document === "undefined") return null;
  try {
    const img = await loadImage(url);
    const maxHeight = 160; // ~20mm tall cap
    const scale = Math.min(1, PRINTER_DOTS / img.width, maxHeight / img.height);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Flatten transparency onto white so alpha doesn't read as black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h).data; // throws if tainted

    const bytesPerRow = PRINTER_DOTS / 8; // center within the full 384-dot width
    const leftDots = Math.floor((PRINTER_DOTS - w) / 2);
    const data = new Uint8Array(bytesPerRow * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const alpha = pixels[i + 3]!;
        const lum =
          alpha < 128
            ? 255
            : 0.299 * pixels[i]! + 0.587 * pixels[i + 1]! + 0.114 * pixels[i + 2]!;
        if (lum < 160) {
          const dot = leftDots + x;
          data[y * bytesPerRow + (dot >> 3)]! |= 0x80 >> (dot & 7);
        }
      }
    }
    return { bytesPerRow, height: h, data };
  } catch {
    return null; // logo is optional — never block the receipt
  }
}

/** Builds the ESC/POS byte stream for a receipt. */
function encodeReceipt(receipt: Receipt, logo: Raster | null): Uint8Array {
  const p = new EscPos().init();

  if (logo) p.align("center").raster(logo).feed(1);
  p.align("center").bold(true).size(true).line(receipt.company.name).size(false).bold(false);
  if (receipt.company.tagline) p.line(receipt.company.tagline);
  if (receipt.company.phone) p.line(receipt.company.phone);
  if (receipt.company.address) p.line(receipt.company.address);

  p.align("left").line(sep());
  p.line(lr("Invoice", receipt.invoiceNo));
  p.line(lr("Date", new Date(receipt.invoiceDate).toLocaleString()));
  if (receipt.cashierName) p.line(lr("Cashier", receipt.cashierName));
  p.line(sep());

  for (const it of receipt.items) {
    p.line(it.name.length > WIDTH ? it.name.slice(0, WIDTH) : it.name);
    p.line(lr(`  ${it.quantity} x ${formatAmount(it.unitPrice)}`, formatAmount(it.totalAmount)));
  }

  p.line(sep());
  p.line(lr("Subtotal", formatAmount(receipt.subtotal)));
  if (receipt.discountAmount > 0) p.line(lr("Discount", `-${formatAmount(receipt.discountAmount)}`));
  p.line(lr("Tax", formatAmount(receipt.taxAmount)));
  p.bold(true).line(lr("TOTAL", formatAmount(receipt.totalAmount))).bold(false);
  p.line(sep());

  for (const pay of receipt.payments) p.line(lr(pay.methodName, formatAmount(pay.amount)));
  p.line(lr("Paid", formatAmount(receipt.paidAmount)));
  if (receipt.balanceAmount > 0) p.line(lr("Balance", formatAmount(receipt.balanceAmount)));

  p.feed(1).align("center").line("Thank you!").feed(3).cut();
  return p.bytesArray();
}

// ---- Connection + write --------------------------------------------------

async function getWriteCharacteristic(device: BtDevice): Promise<BtCharacteristic> {
  const server = await device.gatt!.connect();
  const services = await server.getPrimaryServices();
  for (const svc of services) {
    const chars = await svc.getCharacteristics();
    for (const ch of chars) {
      if (ch.properties.write || ch.properties.writeWithoutResponse) return ch;
    }
  }
  throw new Error("This device has no writable characteristic — is it an ESC/POS printer?");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Prompts the user to pick a Bluetooth printer, then streams the receipt as
 * ESC/POS in small chunks (BLE caps payloads, so we chunk + pace the writes).
 */
export async function printReceiptThermal(receipt: Receipt): Promise<void> {
  const bt = (navigator as unknown as BtNavigator).bluetooth;
  if (!bt) throw new Error("Bluetooth printing isn't supported on this device/browser.");

  const device = await bt.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICES,
  });
  const characteristic = await getWriteCharacteristic(device);

  // Rasterise the logo before encoding (best-effort — null if unavailable).
  const logoSrc = resolveMediaUrl(receipt.company.logoUrl);
  const logo = logoSrc ? await rasterizeLogo(logoSrc) : null;
  const data = encodeReceipt(receipt, logo);

  const CHUNK = 180;
  const writeNoResp =
    characteristic.properties.writeWithoutResponse && characteristic.writeValueWithoutResponse;
  for (let i = 0; i < data.length; i += CHUNK) {
    // Copy the slice into an ArrayBuffer-backed view (Web Bluetooth's BufferSource).
    const chunk = new Uint8Array(data.subarray(i, i + CHUNK));
    if (writeNoResp) await characteristic.writeValueWithoutResponse!(chunk);
    else await characteristic.writeValue(chunk);
    await sleep(20);
  }
}
