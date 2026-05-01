type StatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
};

export default function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg">
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className="mt-3 text-3xl font-bold text-white">{value}</h2>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}