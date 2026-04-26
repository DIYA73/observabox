interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "red" | "green" | "yellow";
}

const colorMap = {
  blue:   "border-blue-500/40 bg-blue-500/10 text-blue-300",
  red:    "border-red-500/40 bg-red-500/10 text-red-300",
  green:  "border-green-500/40 bg-green-500/10 text-green-300",
  yellow: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
};

export default function StatCard({ label, value, sub, color = "blue" }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}
