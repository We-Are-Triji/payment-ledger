/** Client-side avatar image processing: center-crop to square + downscale. */

/** Max output dimension for stored avatars (square). */
const MAX_AVATAR_SIZE = 512;

/** Quality for lossy re-encoding (WebP/JPEG). */
const ENCODE_QUALITY = 0.9;

/**
 * Load a File into an HTMLImageElement via an object URL, revoking it afterward.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the selected image"));
    };
    img.src = url;
  });
}

/** Swap (or append) a file name's extension. */
function withExtension(name: string, ext: string): string {
  const base = name.includes(".")
    ? name.slice(0, name.lastIndexOf("."))
    : name;
  return `${base || "avatar"}.${ext}`;
}

/**
 * Center-crop the given image file to a square, downscale it so neither side
 * exceeds MAX_AVATAR_SIZE, and re-encode it via canvas.
 *
 * The output is a new File whose name carries a valid image extension so that
 * downstream extension validation (getValidatedExtension) keeps working. If
 * canvas processing is unavailable or fails, the original file is returned
 * unchanged so uploads never break.
 */
export async function cropResizeImageToSquare(file: File): Promise<File> {
  // Animated GIFs would lose animation through a canvas; leave them as-is.
  if (file.type === "image/gif") return file;

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const { naturalWidth: w, naturalHeight: h } = img;
  if (!w || !h) return file;

  // Center-crop to the largest possible square.
  const side = Math.min(w, h);
  const sx = Math.floor((w - side) / 2);
  const sy = Math.floor((h - side) / 2);

  // Downscale so the output square is at most MAX_AVATAR_SIZE.
  const outSize = Math.min(side, MAX_AVATAR_SIZE);

  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);

  // Prefer WebP (smaller); fall back to JPEG if unsupported.
  const preferWebp = canvas
    .toDataURL("image/webp")
    .startsWith("data:image/webp");
  const mime = preferWebp ? "image/webp" : "image/jpeg";
  const ext = preferWebp ? "webp" : "jpg";

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, ENCODE_QUALITY)
  );
  if (!blob) return file;

  return new File([blob], withExtension(file.name, ext), {
    type: mime,
    lastModified: Date.now(),
  });
}
