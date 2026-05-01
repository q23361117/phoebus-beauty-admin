"use client";

import AdminSidebar from "@/components/AdminSidebar";
import RequireAuth from "@/components/RequireAuth";
import { db } from "@/lib/firebase";
import { Appointment, AppointmentStatus } from "@/lib/types";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

const statusLabel: Record<AppointmentStatus, string> = {
  pending: "待確認",
  confirmed: "已確認",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到",
};

const statusClass: Record<AppointmentStatus, string> = {
  pending: "bg-amber-500/20 text-amber-200",
  confirmed: "bg-blue-500/20 text-blue-200",
  completed: "bg-green-500/20 text-green-200",
  cancelled: "bg-red-500/20 text-red-200",
  no_show: "bg-slate-500/20 text-slate-200",
};

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getAppointmentTimeValue(item: Appointment) {
  return `${item.date || ""} ${item.startTime || ""}`;
}

function isActiveAppointment(item: Appointment) {
  return item.status !== "completed" && item.status !== "cancelled";
}

export default function RemindersPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const today = getTodayString();
  const tomorrow = addDays(1);
  const next7Days = addDays(7);

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const q = query(collection(db, "appointments"), orderBy("date", "asc"));
      const snap = await getDocs(q);

      const list: Appointment[] = snap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<Appointment, "id">),
      }));

      list.sort((a, b) =>
        getAppointmentTimeValue(a).localeCompare(getAppointmentTimeValue(b))
      );

      setAppointments(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const overdueAppointments = useMemo(() => {
    return appointments.filter(
      (item) => isActiveAppointment(item) && item.date < today
    );
  }, [appointments, today]);

  const todayAppointments = useMemo(() => {
    return appointments.filter(
      (item) => isActiveAppointment(item) && item.date === today
    );
  }, [appointments, today]);

  const tomorrowAppointments = useMemo(() => {
    return appointments.filter(
      (item) => isActiveAppointment(item) && item.date === tomorrow
    );
  }, [appointments, tomorrow]);

  const upcomingAppointments = useMemo(() => {
    return appointments.filter(
      (item) =>
        isActiveAppointment(item) &&
        item.date > tomorrow &&
        item.date <= next7Days
    );
  }, [appointments, tomorrow, next7Days]);

  const handleMarkConfirmed = async (item: Appointment) => {
    await updateDoc(doc(db, "appointments", item.id), {
      status: "confirmed",
      updatedAt: serverTimestamp(),
    });

    await loadAppointments();
  };

  const handleMarkCompleted = async (item: Appointment) => {
    const ok = confirm(`確定將 ${item.customerName} 的預約標記為已完成嗎？`);
    if (!ok) return;

    await updateDoc(doc(db, "appointments", item.id), {
      status: "completed",
      updatedAt: serverTimestamp(),
    });

    await loadAppointments();
  };

  const handleMarkNoShow = async (item: Appointment) => {
    const ok = confirm(`確定將 ${item.customerName} 標記為未到嗎？`);
    if (!ok) return;

    await updateDoc(doc(db, "appointments", item.id), {
      status: "no_show",
      updatedAt: serverTimestamp(),
    });

    await loadAppointments();
  };

  const ReminderCard = ({
    title,
    items,
    emptyText,
    highlight,
  }: {
    title: string;
    items: Appointment[];
    emptyText: string;
    highlight?: boolean;
  }) => {
    return (
      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>

          <span
            className={[
              "rounded-full px-3 py-1 text-sm",
              highlight
                ? "bg-pink-500/20 text-pink-200"
                : "bg-white/10 text-slate-300",
            ].join(" ")}
          >
            {items.length} 筆
          </span>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-white">
                      {item.customerName}
                    </p>

                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs",
                        statusClass[item.status],
                      ].join(" ")}
                    >
                      {statusLabel[item.status]}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    電話：{item.customerPhone || "-"}
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {item.date}　{item.startTime}　｜　{item.serviceName}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    美容師：{item.staffName || "未指定"}　｜　金額：$
                    {item.price || 0}
                  </p>

                  {item.notes ? (
                    <p className="mt-2 rounded-xl bg-black/20 px-3 py-2 text-sm text-slate-300">
                      備註：{item.notes}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.status === "pending" ? (
                    <button
                      onClick={() => handleMarkConfirmed(item)}
                      className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
                    >
                      已確認
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleMarkCompleted(item)}
                    className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
                  >
                    已完成
                  </button>

                  <button
                    onClick={() => handleMarkNoShow(item)}
                    className="rounded-xl bg-slate-600 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                  >
                    未到
                  </button>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-6 text-center text-slate-400">
              {emptyText}
            </div>
          ) : null}
        </div>
      </section>
    );
  };

  return (
    <RequireAuth>
      <div className="phoebis-main flex min-h-screen">
        <AdminSidebar />

        <main className="flex-1 p-4 pt-24 pb-28 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">預約提醒</h1>
              <p className="mt-2 text-slate-400">
                查看今日、明日、逾期與未來 7 天預約
              </p>
            </div>

            <button
              onClick={loadAppointments}
              className="rounded-xl bg-pink-500 px-5 py-3 font-bold text-white hover:bg-pink-600"
            >
              重新整理
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
              <p className="text-sm text-slate-400">逾期未完成</p>
              <h2 className="mt-3 text-3xl font-bold text-red-300">
                {overdueAppointments.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
              <p className="text-sm text-slate-400">今日預約</p>
              <h2 className="mt-3 text-3xl font-bold text-pink-300">
                {todayAppointments.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
              <p className="text-sm text-slate-400">明日預約</p>
              <h2 className="mt-3 text-3xl font-bold text-amber-300">
                {tomorrowAppointments.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
              <p className="text-sm text-slate-400">未來 7 天</p>
              <h2 className="mt-3 text-3xl font-bold text-blue-300">
                {upcomingAppointments.length}
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/90 p-8 text-center text-slate-300">
              載入提醒中...
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              <ReminderCard
                title="逾期未完成"
                items={overdueAppointments}
                emptyText="目前沒有逾期未完成預約"
                highlight
              />

              <ReminderCard
                title="今日預約"
                items={todayAppointments}
                emptyText="今日尚無預約"
                highlight
              />

              <ReminderCard
                title="明日預約"
                items={tomorrowAppointments}
                emptyText="明日尚無預約"
              />

              <ReminderCard
                title="未來 7 天預約"
                items={upcomingAppointments}
                emptyText="未來 7 天尚無預約"
              />
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}