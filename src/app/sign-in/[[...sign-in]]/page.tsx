import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff4ee] px-5 py-12">
      <SignIn forceRedirectUrl="/admin" />
    </main>
  );
}
