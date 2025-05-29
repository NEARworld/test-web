import { supabase } from "@/lib/supabase";

export async function uploadFileToSupabaseStorage(file: File): Promise<{
  fileName: string;
  fileType: string;
  fileUrl: string;
  error?: string;
}> {
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const filePath = `documents/${fileName}`;

  const { data, error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (!data && error) {
    return {
      fileName: file.name,
      fileType: file.type,
      fileUrl: "",
      error: error.message,
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from("documents")
    .getPublicUrl(filePath);

  if (!publicUrlData) {
    return {
      fileName: fileName,
      fileType: file.type,
      fileUrl: "",
      error: "파일 업로드는 성공했으나 공개 URL을 가져오는 데 실패했습니다.",
    };
  }

  return {
    fileName: fileName,
    fileType: file.type,
    fileUrl: publicUrlData.publicUrl,
  };
}
