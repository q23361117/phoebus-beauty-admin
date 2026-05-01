"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";

const items = [
  { href: "/dashboard", label: "儀表板" },
  { href: "/customers", label: "客戶管理" },
  { href: "/services", label: "服務項目" },
  { href: "/appointments", label: "預約管理" },
  { href: "/reminders", label: "預約提醒" },
  { href: "/course-packages", label: "課程堂數" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    setMobileMenuOpen(false);
    router.push("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* 電腦版左側選單 */}
      <aside className="phoebis-sidebar hidden min-h-screen w-64 flex-col md:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <h1 className="text-xl font-bold text-white">菲比斯美業後台</h1>
          <p className="mt-1 text-sm text-pink-200/70">
            Phoebus Beauty Admin
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-2 px-4 py-5">
          {items.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-pink-500 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20"
          >
            登出
          </button>
        </div>
      </aside>

      {/* 手機版頂部列 */}
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">菲比斯美業後台</h1>
            <p className="text-xs text-pink-200/70">Phoebus Beauty Admin</p>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white"
          >
            {mobileMenuOpen ? "關閉" : "選單"}
          </button>
        </div>
      </div>

      {/* 手機版選單遮罩 */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden">
          <button
            type="button"
            aria-label="關閉選單"
            className="absolute inset-0 h-full w-full"
            onClick={closeMobileMenu}
          />
        </div>
      ) : null}

      {/* 手機版右上展開選單 */}
      {mobileMenuOpen ? (
        <div className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur md:hidden">
          <div className="mb-3 border-b border-white/10 pb-3">
            <p className="text-sm font-bold text-white">功能選單</p>
            <p className="mt-1 text-xs text-slate-400">
              選擇要前往的後台功能
            </p>
          </div>

          <nav className="grid gap-2">
            {items.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={[
                    "rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-pink-500 text-white"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-2xl bg-red-500/90 px-4 py-3 text-sm font-bold text-white hover:bg-red-600"
          >
            登出
          </button>
        </div>
      ) : null}
    </>
  );
}