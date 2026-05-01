"use client";

import AdminSidebar from "@/components/AdminSidebar";
import RequireAuth from "@/components/RequireAuth";
import { db } from "@/lib/firebase";
import { BeautyService } from "@/lib/types";
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

export default function ServicesPage() {
  const [services, setServices] = useState<BeautyService[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("臉部保養");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [description, setDescription] = useState("");

  const loadServices = async () => {
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const list: BeautyService[] = snap.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<BeautyService, "id">),
    }));

    setServices(list);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategory("臉部保養");
    setPrice("");
    setDurationMinutes("");
    setEnabled(true);
    setDescription("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price.trim() || !durationMinutes.trim()) {
      alert("請輸入服務名稱、價格與所需時間");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      enabled,
      description: description.trim(),
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "services", editingId), payload);
    } else {
      await addDoc(collection(db, "services"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    resetForm();
    loadServices();
  };

  const handleEdit = (service: BeautyService) => {
    setEditingId(service.id);
    setName(service.name || "");
    setCategory(service.category || "臉部保養");
    setPrice(String(service.price || ""));
    setDurationMinutes(String(service.durationMinutes || ""));
    setEnabled(service.enabled);
    setDescription(service.description || "");
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("確定要刪除此服務項目嗎？");
    if (!ok) return;

    await deleteDoc(doc(db, "services", id));
    loadServices();
  };

  return (
    <RequireAuth>
      <div className="phoebis-main flex min-h-screen">
        <AdminSidebar />

        <main className="flex-1 p-4 pt-24 pb-28 md:p-6">
          <h1 className="text-3xl font-bold text-white">服務項目</h1>
          <p className="mt-2 text-slate-400">管理美容服務、價格與所需時間</p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5"
          >
            <h2 className="text-xl font-bold text-white">
              {editingId ? "編輯服務" : "新增服務"}
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="服務名稱，例如 深層清潔"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <select
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>臉部保養</option>
                <option>美睫</option>
                <option>霧眉</option>
                <option>除毛</option>
                <option>按摩</option>
                <option>課程包</option>
                <option>其他</option>
              </select>

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="價格"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

              <input
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                placeholder="所需時間，分鐘"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>

            <textarea
              className="mt-4 min-h-24 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
              placeholder="服務說明"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label className="mt-4 flex items-center gap-3 text-slate-300">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              啟用此服務
            </label>

            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600"
              >
                {editingId ? "儲存修改" : "新增服務"}
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
                  <th className="px-4 py-3">服務名稱</th>
                  <th className="px-4 py-3">分類</th>
                  <th className="px-4 py-3">價格</th>
                  <th className="px-4 py-3">時間</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>

              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">{service.name}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {service.category}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      ${service.price}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {service.durationMinutes} 分鐘
                    </td>
                    <td className="px-4 py-3">
                      {service.enabled ? (
                        <span className="rounded-full bg-green-500/20 px-3 py-1 text-green-300">
                          啟用
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-500/20 px-3 py-1 text-red-300">
                          停用
                        </span>
                      )}
                    </td>
                    <td className="space-x-2 px-4 py-3">
                      <button
                        onClick={() => handleEdit(service)}
                        className="rounded-lg bg-blue-500 px-3 py-2 text-white"
                      >
                        編輯
                      </button>

                      <button
                        onClick={() => handleDelete(service.id)}
                        className="rounded-lg bg-red-500 px-3 py-2 text-white"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}

                {services.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      尚未建立服務項目
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