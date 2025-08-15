import { uploadImage } from "@/api/image.api";
import { useCallback, useState } from "react";

export default function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadImage(file, (p) => setProgress(p));
      return url;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => setProgress(0), []);

  return { uploading, progress, upload, reset };
}
