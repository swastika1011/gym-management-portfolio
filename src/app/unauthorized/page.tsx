import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff4ee] px-5 py-12 text-[#3f0000]">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_20px_50px_rgba(154,52,18,0.12)]">
        <h1 className="font-heading text-3xl font-bold">Access Denied</h1>
        <p className="mt-3 text-[#604b46]">
          You are not authorized to access the admin dashboard.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-[#9a3412] px-5 font-semibold text-white transition-colors hover:bg-[#7c2d12]"
        >
          Return to home
        </Link>
      </section>
    </main>
  );
}
