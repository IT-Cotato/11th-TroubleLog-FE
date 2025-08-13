import type { ApiEnvelope } from "@/types/common.model";
import api from "./axios";

// 단일 이미지 업로드
export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const form = new FormData();
  // 서버 필드명: multipartFile
  form.append("multipartFile", file, file.name);

  const res = await api.post<ApiEnvelope<string>>("/image", form, {
    onUploadProgress: (e) => {
      if (!onProgress || !e.total) return;
      onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  const body = res.data;
  if (body?.success && typeof body.data === "string") {
    return body.data;
  }
  throw new Error(body?.error?.message ?? "이미지 업로드에 실패했습니다.");
}
