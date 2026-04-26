"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  bucket: string;
  avg_value: number;
  max_value: number;
  name: string;
}

export default function MetricChart({ data, title }: { data: DataPoint[]; title: string }) {
  const formatted = data.map((d) => ({
    ...d,
    time: format(new Date(d.bucket), "HH:mm"),
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 11 }} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#9ca3af" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="avg_value" name="avg" stroke="#0ea5e9" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="max_value" name="max" stroke="#f59e0b" dot={false} strokeWidth={1} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
