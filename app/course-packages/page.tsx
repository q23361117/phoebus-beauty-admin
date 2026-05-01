"use client";

import AdminSidebar from "@/components/AdminSidebar";
import RequireAuth from "@/components/RequireAuth";
import { db } from "@/lib/firebase";
import { CoursePackage, CoursePackageStatus } from "@/lib/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";

type UsageRecord = {
  id: string;
  packageId: string;
  customerName: string;
  courseName: string;
  usedCount: number;
  usedDate: string;
  staffName?: string;
  notes?: string;
  createdAt?: any;
};

const statusLabel: Record<CoursePackageStatus, string> = {
  active: "使用中",
  completed: "已用完",
  cancelled: "已取消",
};

export default function CoursePackagesPage() {
  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [courseName, setCourseName] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const [usedSessions, setUsedSessions] = useState("0");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [status, setStatus] = useState<CoursePackageStatus>("active");
  const [notes, setNotes] = useState("");

  const [useStaffName, setUseStaffName] = useState("");
  const [useNotes, setUseNotes] = useState("");

  const loadPackages = async () => {
    const q = query(collection(db, "coursePackages"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const list: CoursePackage[] = snap.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<CoursePackage, "id">),
    }));

    setPackages(list);
  };

  const loadUsageRecords = async (packageId: string) => {
    const q = query(
      collection(db, "courseUsageRecords"),
      where("packageId", "==", packageId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    const list: UsageRecord[] = snap.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<UsageRecord, "id">),
    }));

    setUsageRecords(list);
    setSelectedPackageId(packageId);
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCustomerName("");
    setCustomerPhone("");
    setCourseName("");
    setTotalSessions("");
    setUsedSessions("0");
    setPurchaseAmount("");
    setPurchaseDate("");
    setStatus("active");
    setNotes("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !courseName.trim() || !totalSessions.trim()) {
      alert("請輸入客戶姓名、課程名稱與總堂數");
      return;
    }

    const total = Number(totalSessions || 0);
    const used = Number(usedSessions || 0);
    const remaining = Math.max(total - used, 0);

    const finalStatus: CoursePackageStatus =
      status === "cancelled" ? "cancelled" : remaining <= 0 ? "completed" : "active";

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      courseName: courseName.trim(),
      totalSessions: total,
      usedSessions: used,
      remainingSessions: remaining,
      purchaseAmount: Number(purchaseAmount || 0),
      purchaseDate,
      status: finalStatus,
      notes: notes.trim(),
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "coursePackages", editingId), payload);
    } else {
      await addDoc(collection(db, "coursePackages"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    resetForm();
    loadPackages();
  };

  const handleEdit = (item: CoursePackage) => {
    setEditingId(item.id);
    setCustomerName(item.customerName || "");
    setCustomerPhone(item.customerPhone || "");
    setCourseName(item.courseName || "");
    setTotalSessions(String(item.totalSessions || ""));
    setUsedSessions(String(item.usedSessions || 0));
    setPurchaseAmount(String(item.purchaseAmount || ""));
    setPurchaseDate(item.purchaseDate || "");
    setStatus(item.status || "active");
    setNotes(item.notes || "");
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("確定要刪除此課程包嗎？");
    if (!ok) return;

    await deleteDoc(doc(db, "coursePackages", id));
    loadPackages();

    if (selectedPackageId === id) {
      setSelectedPackageId(null);
      setUsageRecords([]);
    }
  };

  const handleUseOneSession = async (item: CoursePackage) => {
    if (item.status === "cancelled") {
      alert("此課程已取消，不能扣堂數");
      return;
    }

    if (item.remainingSessions <= 0) {
      alert("此課程已沒有剩餘堂數");
      return;
    }

    const ok = confirm(`確定要幫 ${item.customerName} 使用 1 堂「${item.courseName}」嗎？`);
    if (!ok) return;

    const newUsed = Number(item.usedSessions || 0) + 1;
    const newRemaining = Math.max(Number(item.totalSessions || 0) - newUsed, 0);
    const newStatus: CoursePackageStatus = newRemaining <= 0 ? "completed" : "active";

    await updateDoc(doc(db, "coursePackages", item.id), {
      usedSessions: newUsed,
      remainingSessions: newRemaining,
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    const today = new Date().toISOString().slice(0, 10);

    await addDoc(collection(db, "courseUsageRecords"), {
      packageId: item.id,
      customerName: item.customerName,
      courseName: item.courseName,
      usedCount: 1,
      usedDate: today,
      staffName: useStaffName.trim(),
      notes: useNotes.trim(),
      createdAt: serverTimestamp(),
    });

    setUseStaffName("");
    setUseNotes("");

    await loadPackages();
    await loadUsageRecords(item.id);
  };

  return (
    <RequireAuth>
      <div className="phoebis-main flex min-h-screen">
        <AdminSidebar />

        <main className="flex-1 p-4 pt-24 pb-8 md:p-6">
          <h1 className="text-3xl font-bold text-white">課程堂數</h1>
          <p className="mt-2 text-slate-400">管理客戶購買課程、剩餘堂數與每次使用紀錄</p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-2xl border border-white/10 bg-slate-900/90 p-5"
          >
            <h2 className="text-xl font-bold text-white">
              {editingId ? "編輯課程包" : "新增課程包"}
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="客戶姓名"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="客戶電話"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="課程名稱，例如 全能抗衰 10 堂"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="總堂數"
                type="number"
                value={totalSessions}
                onChange={(e) => setTotalSessions(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="已使用堂數"
                type="number"
                value={usedSessions}
                onChange={(e) => setUsedSessions(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="購買金額"
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />

              <select
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value as CoursePackageStatus)}
              >
                <option value="active">使用中</option>
                <option value="completed">已用完</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>

            <textarea
              className="mt-4 min-h-24 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
              placeholder="備註，例如適合療程、付款狀態、特殊注意事項"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600"
              >
                {editingId ? "儲存修改" : "新增課程包"}
              </button>

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl bg-white/10 px-5 py-3 font-bold text-white hover:bg-white/20"
                >
                  取消編輯
                </button>
              ) : null}
            </div>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/90 p-5">
            <h2 className="text-xl font-bold text-white">扣堂數紀錄備註</h2>
            <p className="mt-1 text-sm text-slate-400">
              按下「使用 1 堂」前，可先填寫美容師與本次備註。
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="美容師"
                value={useStaffName}
                onChange={(e) => setUseStaffName(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="本次使用備註"
                value={useNotes}
                onChange={(e) => setUseNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/90">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3">客戶</th>
                  <th className="px-4 py-3">課程</th>
                  <th className="px-4 py-3">總堂數</th>
                  <th className="px-4 py-3">已用</th>
                  <th className="px-4 py-3">剩餘</th>
                  <th className="px-4 py-3">金額</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>

              <tbody>
                {packages.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">
                      {item.customerName}
                      <div className="text-xs text-slate-500">{item.customerPhone || "-"}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-300">{item.courseName}</td>

                    <td className="px-4 py-3 text-slate-300">{item.totalSessions}</td>

                    <td className="px-4 py-3 text-slate-300">{item.usedSessions}</td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-200">
                        {item.remainingSessions}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-300">${item.purchaseAmount || 0}</td>

                    <td className="px-4 py-3 text-slate-300">{statusLabel[item.status]}</td>

                    <td className="space-x-2 px-4 py-3">
                      <button
                        onClick={() => handleUseOneSession(item)}
                        className="rounded-lg bg-pink-500 px-3 py-2 text-white"
                      >
                        使用 1 堂
                      </button>

                      <button
                        onClick={() => loadUsageRecords(item.id)}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-white"
                      >
                        紀錄
                      </button>

                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded-lg bg-blue-500 px-3 py-2 text-white"
                      >
                        編輯
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg bg-red-500 px-3 py-2 text-white"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}

                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      尚未建立課程包
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {selectedPackageId ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/90 p-5">
              <h2 className="text-xl font-bold text-white">使用紀錄</h2>

              <div className="mt-4 space-y-3">
                {usageRecords.map((record) => (
                  <div key={record.id} className="rounded-xl bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-white">
                          {record.customerName}｜{record.courseName}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          使用日期：{record.usedDate}｜扣除：{record.usedCount} 堂
                        </p>
                      </div>

                      <span className="rounded-full bg-pink-500/20 px-3 py-1 text-sm text-pink-200">
                        {record.staffName || "未填美容師"}
                      </span>
                    </div>

                    {record.notes ? (
                      <p className="mt-2 text-sm text-slate-300">備註：{record.notes}</p>
                    ) : null}
                  </div>
                ))}

                {usageRecords.length === 0 ? (
                  <div className="rounded-xl bg-white/5 p-6 text-center text-slate-400">
                    尚無使用紀錄
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </RequireAuth>
  );
}