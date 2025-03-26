import { createClient } from "@supabase/supabase-js";

// Supabase 프로젝트 URL과 익명 키를 설정합니다.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
