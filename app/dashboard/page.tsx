import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center p-6">
      <div className="container mx-auto">
        <header className="my-12 text-center">
          <h1 className="text-5xl font-bold">사회적협동조합 청소년 자립학교</h1>
          <p className="text-muted-foreground mt-2 text-xl">
            직원 전용 웹서비스
          </p>
          <div className="flex justify-center">
            <Image src="/youth.png" alt="logo" width={500} height={500} />
          </div>
        </header>
      </div>
    </div>
  );
}
