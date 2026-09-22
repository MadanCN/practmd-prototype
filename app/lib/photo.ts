/** Downscale an uploaded image to ≤256px JPEG so it fits comfortably in localStorage.
 *  Shared by the admin Add/Edit Provider form and the provider portal's activation wizard,
 *  so a photo looks and behaves the same wherever it's uploaded. */
export function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("read failed"));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(fr.result);
    };
    fr.readAsDataURL(file);
  });
}
