export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  birthday?: string;
  lineId?: string;
  notes?: string;
  totalSpent?: number;
  createdAt?: any;
  updatedAt?: any;
};

export type BeautyService = {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  enabled: boolean;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Appointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName?: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: AppointmentStatus;
  notes?: string;
  price?: number;
  createdAt?: any;
  updatedAt?: any;
};

export type CoursePackageStatus = "active" | "completed" | "cancelled";

export type CoursePackage = {
  id: string;
  customerName: string;
  customerPhone?: string;
  courseName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  purchaseAmount: number;
  purchaseDate: string;
  status: CoursePackageStatus;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type CourseUsageRecord = {
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