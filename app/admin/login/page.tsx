import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in | Coastal Route Coffee", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin");

  return (
    <main className="grid min-h-screen bg-[#0b1824] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <Image src="/images/coastal-hero.png" alt="California coast viewed from a winding road" fill priority className="object-cover" sizes="55vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,24,36,.25),rgba(11,24,36,.92))]" />
        <div className="absolute inset-x-12 bottom-12 max-w-lg text-white">
          <p className="eyebrow text-[#e2b45d]">Coastal Route Coffee</p>
          <p className="font-display mt-5 text-6xl leading-[0.9] tracking-[-0.04em]">Keep the shelves stocked and the story fresh.</p>
        </div>
      </section>
      <section className="flex items-center px-6 py-16 sm:px-14 lg:px-20">
        <div className="mx-auto w-full max-w-md text-white">
          <Image src="/images/coastal-route-badge.png" alt="" width={72} height={72} className="h-18 w-18 object-contain" />
          <p className="eyebrow mt-10 text-[#e2b45d]">Private workspace</p>
          <h1 className="font-display mt-4 text-5xl leading-none tracking-[-0.035em]">Roastery admin</h1>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/58">Manage sellable inventory and the words customers see across the storefront.</p>
          <LoginForm />
          <Link href="/" className="mt-8 inline-flex text-xs font-bold tracking-[0.12em] text-white/50 uppercase hover:text-white">← Back to storefront</Link>
        </div>
      </section>
    </main>
  );
}
