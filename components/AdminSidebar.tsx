"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const items = [
  { href: "/dashboard", label: "儀表板" },
  { href: "/customers", label: "客戶管理" },
  { href: "/services", label: "服務項目" },
  { href: "/appointments", label: "預約管理" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <aside className="phoebis-sidebar hidden min-h-screen w-64 flex-col md:flex">
      <div className="border-b border-white/10 px-5 py-6">
        <h1 className="text-xl font-bold text-white">菲比斯美業後台</h1>
        <p className="mt-1 text-sm text-pink-200/70">Phoebus Beauty Admin</p>
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
  );
}