"use client";

import AdminSidebar from "@/components/AdminSidebar";
import RequireAuth from "@/components/RequireAuth";
import { db } from "@/lib/firebase";
import { Customer } from "@/lib/types";
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [lineId, setLineId] = useState("");
  const [notes, setNotes] = useState("");

  const loadCustomers = async () => {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const list: Customer[] = snap.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Customer, "id">),
    }));

    setCustomers(list);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPhone("");
    setBirthday("");
    setLineId("");
    setNotes("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      alert("請輸入客戶姓名與電話");
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      birthday: birthday.trim(),
      lineId: lineId.trim(),
      notes: notes.trim(),
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "customers", editingId), payload);
    } else {
      await addDoc(collection(db, "customers"), {
        ...payload,
        totalSpent: 0,
        createdAt: serverTimestamp(),
      });
    }

    resetForm();
    loadCustomers();
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setName(customer.name || "");
    setPhone(customer.phone || "");
    setBirthday(customer.birthday || "");
    setLineId(customer.lineId || "");
    setNotes(customer.notes || "");
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("確定要刪除此客戶嗎？");
    if (!ok) return;

    await deleteDoc(doc(db, "customers", id));
    loadCustomers();
  };

  return (
    <RequireAuth>
      <div className="phoebis-main flex min-h-screen">
        <AdminSidebar />

        <main className="flex-1 p-4 pt-24 pb-28 md:p-6">
          <h1 className="text-3xl font-bold text-white">客戶管理</h1>
          <p className="mt-2 text-slate-400">建立與管理美容客戶資料</p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5"
          >
            <h2 className="text-xl font-bold text-white">
              {editingId ? "編輯客戶" : "新增客戶"}
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="客戶姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="電話"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="生日，例如 1995-01-01"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="LINE ID"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
              />
            </div>

            <textarea
              className="mt-4 min-h-24 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
              placeholder="備註，例如膚況、過敏、常做項目"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600"
              >
                {editingId ? "儲存修改" : "新增客戶"}
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
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">電話</th>
                  <th className="px-4 py-3">生日</th>
                  <th className="px-4 py-3">LINE</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">{customer.name}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {customer.phone}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {customer.birthday || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {customer.lineId || "-"}
                    </td>
                    <td className="space-x-2 px-4 py-3">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="rounded-lg bg-blue-500 px-3 py-2 text-white"
                      >
                        編輯
                      </button>

                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="rounded-lg bg-red-500 px-3 py-2 text-white"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}

                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      尚未建立客戶
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