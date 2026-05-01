"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const items = [
  { href: "/dashboard", label: "儀表板" },
  { href: "/customers", label: "客戶" },
  { href: "/services", label: "服務" },
  { href: "/appointments", label: "預約" },
  { href: "/reminders", label: "提醒" },
  { href: "/course-packages", label: "課程" },
];
export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
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

      {/* 手機版頂部標題 */}
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-black/85 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">菲比斯美業後台</h1>
            <p className="text-xs text-pink-200/70">Phoebus Beauty Admin</p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white"
          >
            登出
          </button>
        </div>
      </div>

      {/* 手機版底部選單 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-white/10 bg-black/90 px-2 py-2 backdrop-blur md:hidden">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "mx-1 rounded-xl px-2 py-3 text-center text-xs font-medium transition",
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
    </>
  );
}