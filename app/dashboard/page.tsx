"use client";

import AdminSidebar from "@/components/AdminSidebar";
import RequireAuth from "@/components/RequireAuth";
import StatCard from "@/components/StatCard";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [customerCount, setCustomerCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [todayAppointmentCount, setTodayAppointmentCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      const customersSnap = await getDocs(collection(db, "customers"));
      const servicesSnap = await getDocs(collection(db, "services"));
      const appointmentsSnap = await getDocs(collection(db, "appointments"));

      const today = new Date().toISOString().slice(0, 10);

      let todayCount = 0;

      appointmentsSnap.forEach((docItem) => {
        const data = docItem.data();
        if (data.date === today) {
          todayCount += 1;
        }
      });

      setCustomerCount(customersSnap.size);
      setServiceCount(servicesSnap.size);
      setAppointmentCount(appointmentsSnap.size);
      setTodayAppointmentCount(todayCount);
    };

    loadDashboard();
  }, []);

  return (
    <RequireAuth>
      <div className="phoebis-main flex min-h-screen">
        <AdminSidebar />

        <main className="flex-1 p-4 pt-24 pb-28 md:p-6">
          <div>
            <h1 className="text-3xl font-bold text-white">儀表板</h1>
            <p className="mt-2 text-slate-400">美容業後台總覽</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="客戶總數"
              value={customerCount}
              hint="目前建立的客戶資料"
            />
            <StatCard
              title="服務項目"
              value={serviceCount}
              hint="目前可提供的服務"
            />
            <StatCard
              title="全部預約"
              value={appointmentCount}
              hint="累積預約筆數"
            />
            <StatCard
              title="今日預約"
              value={todayAppointmentCount}
              hint="今天需要處理的預約"
            />
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-bold text-white">第一版功能</h2>

            <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-4">
                客戶管理：新增、編輯、刪除客戶
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                服務項目：設定服務價格與時間
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                預約管理：建立美容預約
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                登入權限：Firebase Auth
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}