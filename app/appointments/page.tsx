"use client";

import AdminSidebar from "@/components/AdminSidebar";
import RequireAuth from "@/components/RequireAuth";
import { db } from "@/lib/firebase";
import { Appointment, AppointmentStatus } from "@/lib/types";
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
} from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";

const statusOptions: { label: string; value: AppointmentStatus }[] = [
  { label: "待確認", value: "pending" },
  { label: "已確認", value: "confirmed" },
  { label: "已完成", value: "completed" },
  { label: "已取消", value: "cancelled" },
  { label: "未到", value: "no_show" },
];

const statusLabel: Record<AppointmentStatus, string> = {
  pending: "待確認",
  confirmed: "已確認",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("pending");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  const loadAppointments = async () => {
    const q = query(
      collection(db, "appointments"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    const list: Appointment[] = snap.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Appointment, "id">),
    }));

    setAppointments(list);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCustomerName("");
    setCustomerPhone("");
    setServiceName("");
    setStaffName("");
    setDate("");
    setStartTime("");
    setStatus("pending");
    setPrice("");
    setNotes("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !serviceName.trim()) {
      alert("請輸入客戶姓名、電話與服務項目");
      return;
    }

    if (!date || !startTime) {
      alert("請選擇預約日期與時間");
      return;
    }

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceName: serviceName.trim(),
      staffName: staffName.trim(),
      date,
      startTime,
      status,
      price: Number(price || 0),
      notes: notes.trim(),
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "appointments", editingId), payload);
    } else {
      await addDoc(collection(db, "appointments"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    resetForm();
    loadAppointments();
  };

  const handleEdit = (item: Appointment) => {
    setEditingId(item.id);
    setCustomerName(item.customerName || "");
    setCustomerPhone(item.customerPhone || "");
    setServiceName(item.serviceName || "");
    setStaffName(item.staffName || "");
    setDate(item.date || "");
    setStartTime(item.startTime || "");
    setStatus(item.status || "pending");
    setPrice(String(item.price || ""));
    setNotes(item.notes || "");
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("確定要刪除此預約嗎？");
    if (!ok) return;

    await deleteDoc(doc(db, "appointments", id));
    loadAppointments();
  };

  return (
    <RequireAuth>
        <div className="phoebis-main flex min-h-screen">
        <AdminSidebar />

        <main className="flex-1 p-4 pt-24 pb-28 md:p-6">
          <h1 className="text-3xl font-bold text-white">預約管理</h1>
          <p className="mt-2 text-slate-400">建立與管理美容預約</p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5"
          >
            <h2 className="text-xl font-bold text-white">
              {editingId ? "編輯預約" : "新增預約"}
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
                placeholder="服務項目，例如 深層清潔"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="美容師"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <select
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="金額"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <textarea
              className="mt-4 min-h-24 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
              placeholder="備註"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600"
              >
                {editingId ? "儲存修改" : "新增預約"}
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

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3">日期</th>
                  <th className="px-4 py-3">時間</th>
                  <th className="px-4 py-3">客戶</th>
                  <th className="px-4 py-3">服務</th>
                  <th className="px-4 py-3">美容師</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">金額</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">{item.date}</td>

                    <td className="px-4 py-3 text-slate-300">
                      {item.startTime}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {item.customerName}
                      <div className="text-xs text-slate-500">
                        {item.customerPhone}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {item.serviceName}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {item.staffName || "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {statusLabel[item.status]}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      ${item.price || 0}
                    </td>

                    <td className="space-x-2 px-4 py-3">
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

                {appointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      尚未建立預約
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}