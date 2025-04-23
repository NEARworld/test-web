import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  fallback?: string;
  className?: string;
}

/**
 * @param src - 이미지 URL (선택적)
 * @param alt - 이미지 대체 텍스트 (선택적)
 * @param name - 사용자 이름 (선택적, fallback이 제공되지 않은 경우 첫 글자를 fallback으로 사용)
 * @param fallback - fallback에 표시할 텍스트 (선택적, 기본값은 name의 첫 글자)
 * @param className - 추가 CSS 클래스 (선택적)
 */
export function UserAvatar({
  src,
  alt,
  name,
  fallback,
  className,
}: UserAvatarProps) {
  // fallback 텍스트 결정: 명시적 fallback 또는 name의 첫 글자 또는 '?'
  const fallbackText = fallback || (name ? name.charAt(0) : "?");

  return (
    <Avatar className={`h-5 w-5 ${className || ""}`}>
      {src ? <AvatarImage src={src} alt={alt || name || ""} /> : null}
      <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
    </Avatar>
  );
}
