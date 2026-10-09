import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 3 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

function hasValidSignature(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 12) return false;
  switch (ext) {
    case "png":
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    case "jpg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "webp":
      return (
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );
    case "avif":
      return buffer.toString("ascii", 4, 8) === "ftyp";
    default:
      return false;
  }
}

export interface UploadResult {
  path?: string;
  error?: string;
}

export async function saveUploadedImage(file: unknown): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) return {};
  if (file.size > MAX_BYTES) {
    return { error: "La imagen supera el tamaño máximo de 3 MB." };
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return { error: "Formato no permitido. Usá PNG, JPG, WEBP o AVIF." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(buffer, ext)) {
    return { error: "El archivo no parece ser una imagen válida." };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  return { path: `/uploads/${filename}` };
}

export function deleteUploadedImage(imagePath: string | null | undefined): void {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  const filename = path.basename(imagePath);
  const full = path.join(process.cwd(), "public", "uploads", filename);
  if (path.dirname(full) !== path.join(process.cwd(), "public", "uploads")) return;
  try {
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {
    /* silencioso: el archivo puede no existir */
  }
}
