import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
export async function uploadFileToSupabaseStorage(file: File): Promise<{
  originalFileName: string;
  fileType: string;
  fileUrl: string;
  error?: string;
}> {
  const bytes = await file.arrayBuffer();
  const originalFileName = file.name;
  const fileExt = originalFileName.split(".").pop() || "";
  const uniqueFileName = `${uuidv4()}.${fileExt}`; // Supabase 내에서의 파일명 (키)

  const { data, error } = await supabase.storage
    .from("documents")
    .upload(uniqueFileName, bytes, {
      contentType: file.type,
      upsert: false, // 동일 이름 파일 덮어쓰기 방지 (필요시 true)
    });

  if (!data && error) {
    return {
      originalFileName,
      fileType: file.type,
      fileUrl: "",
      error: error.message,
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from("documents")
    .getPublicUrl(uniqueFileName);

  if (!publicUrlData) {
    return {
      originalFileName,
      fileType: file.type,
      fileUrl: "",
      error: "파일 업로드는 성공했으나 공개 URL을 가져오는 데 실패했습니다.",
    };
  }

  return {
    originalFileName,
    fileType: file.type,
    fileUrl: publicUrlData.publicUrl,
  };
}
