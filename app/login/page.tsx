"use client";

import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorText("請輸入 Email 與密碼");
      return;
    }

    try {
      setLoading(true);
      setErrorText("");

      await signInWithEmailAndPassword(auth, email.trim(), password);

      router.push("/dashboard");
    } catch (error: any) {
      console.log(error);
      setErrorText("登入失敗，請確認帳號密碼是否正確");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="phoebis-bg flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500 text-2xl font-bold text-white shadow-lg">
  菲
</div>
        <h1 className="text-2xl font-bold text-white">菲比斯美業後台</h1>
        <p className="mt-2 text-sm text-slate-400">預約、客戶、服務與營收管理系統</p>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
            placeholder="密碼"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorText ? (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorText}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-pink-500 px-4 py-3 font-bold text-white hover:bg-pink-600 disabled:opacity-60"
          >
            {loading ? "登入中..." : "登入菲比斯後台"}
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          還沒有帳號？{" "}
          <Link href="/register" className="text-pink-300 hover:underline">
            建立帳號
          </Link>
        </p>
      </form>
    </main>
  );
}