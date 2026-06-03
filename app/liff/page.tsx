"use client";

import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";

type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

type ServiceOption = {
  id: string;
  name: string;
  price?: number;
  durationMinutes?: number;
  enabled?: boolean;
};

export default function LiffBookingPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [liffReady, setLiffReady] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [services, setServices] = useState<ServiceOption[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  const loadServices = async () => {
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const list: ServiceOption[] = snap.docs
      .map((item) => ({
        id: item.id,
        ...(item.data() as Omit<ServiceOption, "id">),
      }))
      .filter((item) => item.enabled !== false);

    setServices(list);

    if (list.length > 0 && !serviceName) {
      setServiceName(list[0].name);
    }
  };

  const initFirebaseAuth = async () => {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  };

  const initLiff = async () => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    if (!liffId) {
      setLiffReady(false);
      return;
    }

    const liffModule = await import("@line/liff");
    const liff = liffModule.default;

    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();

    setLineProfile({
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    });

    setCustomerName((prev) => prev || profile.displayName || "");
    setLiffReady(true);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setErrorText("");

        await initFirebaseAuth();
        await loadServices();

        try {
          await initLiff();
        } catch (liffError) {
          console.log("LIFF 初始化失敗，先用一般網頁模式", liffError);
          setLiffReady(false);
        }
      } catch (error) {
        console.log(error);
        setErrorText("系統初始化失敗，請稍後再試");
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findOrCreateCustomer = async () => {
    const phone = customerPhone.trim();

    if (!phone) return null;

    const q = query(
      collection(db, "customers"),
      where("phone", "==", phone),
      limit(1)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const customerDoc = snap.docs[0];

      await updateDoc(doc(db, "customers", customerDoc.id), {
        name: customerName.trim(),
        lineUserId: lineProfile?.userId || "",
        lineDisplayName: lineProfile?.displayName || "",
        linePictureUrl: lineProfile?.pictureUrl || "",
        updatedAt: serverTimestamp(),
      });

      return customerDoc.id;
    }

    const newCustomer = await addDoc(collection(db, "customers"), {
      name: customerName.trim(),
      phone,
      lineId: "",
      lineUserId: lineProfile?.userId || "",
      lineDisplayName: lineProfile?.displayName || "",
      linePictureUrl: lineProfile?.pictureUrl || "",
      notes: "由 LIFF 預約頁建立",
      totalSpent: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newCustomer.id;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert("請輸入姓名");
      return;
    }

    if (!customerPhone.trim()) {
      alert("請輸入電話");
      return;
    }

    if (!serviceName.trim()) {
      alert("請選擇服務項目");
      return;
    }

    if (!date || !startTime) {
      alert("請選擇預約日期與時間");
      return;
    }

    try {
      setSubmitting(true);
      setErrorText("");

      await initFirebaseAuth();

      const customerId = await findOrCreateCustomer();

      const selectedService = services.find((item) => item.name === serviceName);

      await addDoc(collection(db, "appointments"), {
        customerId: customerId || "",
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceName: serviceName.trim(),
        staffName: "",
        date,
        startTime,
        status: "pending",
        price: Number(selectedService?.price || 0),
        notes: notes.trim(),
        source: "liff",
        createdBy: "customer",
        lineUserId: lineProfile?.userId || "",
        lineDisplayName: lineProfile?.displayName || "",
        linePictureUrl: lineProfile?.pictureUrl || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("預約已送出，店家確認後會再與您聯繫。");

      setServiceName(services[0]?.name || "");
      setDate("");
      setStartTime("");
      setNotes("");
    } catch (error) {
      console.log(error);
      setErrorText("預約送出失敗，請稍後再試或聯絡客服");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 text-center">
            <p className="text-lg font-bold">菲比斯美業預約</p>
            <p className="mt-2 text-sm text-slate-400">系統載入中...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-amber-200/20 bg-slate-950/90 p-5 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500 text-2xl font-bold text-black">
              菲
            </div>

            <h1 className="mt-4 text-2xl font-bold text-white">
              菲比斯美業預約
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              填寫預約資料後，店家會再為您確認時段
            </p>

            {lineProfile ? (
              <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                LINE 使用者：{lineProfile.displayName}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-400">
                {liffReady ? "LINE 已連線" : "一般網頁模式"}
              </div>
            )}
          </div>

          {errorText ? (
            <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorText}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">姓名</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                placeholder="請輸入姓名"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">電話</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                placeholder="請輸入電話"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                服務項目
              </label>

              {services.length > 0 ? (
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                >
                  {services.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                      {item.price ? `｜$${item.price}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                  placeholder="請輸入想預約的服務"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  日期
                </label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  時間
                </label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">備註</label>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                placeholder="例如：想預約老師、膚況、特殊需求"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-amber-500 px-5 py-4 text-base font-bold text-black hover:bg-amber-400 disabled:opacity-60"
            >
              {submitting ? "送出中..." : "送出預約"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          預約送出不代表完成保留，實際時段以店家確認為準。
        </p>
      </div>
    </main>
  );
}