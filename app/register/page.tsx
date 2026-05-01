"use client";

import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorText("請輸入 Email 與密碼");
      return;
    }

    if (password.length < 6) {
      setErrorText("密碼至少需要 6 碼");
      return;
    }

    try {
      setLoading(true);
      setErrorText("");

      await createUserWithEmailAndPassword(auth, email.trim(), password);

      router.push("/dashboard");
    } catch (error: any) {
      console.log(error);
      setErrorText("註冊失敗，請確認 Email 是否已被使用");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="phoebis-bg flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white">建立美容後台帳號</h1>
        <p className="mt-2 text-sm text-slate-400">第一版先使用 Email 註冊</p>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
            placeholder="密碼，至少 6 碼"
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
            {loading ? "建立中..." : "建立帳號"}
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          已經有帳號？{" "}
          <Link href="/login" className="text-pink-300 hover:underline">
            返回登入
          </Link>
        </p>
      </form>
    </main>
  );
}