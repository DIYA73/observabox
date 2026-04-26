"use client";

import { useState, useEffect } from "react";
import MetricChart from "@/components/charts/MetricChart";

interface MetricRow {
  bucket: string;
  name: string;
  type: string;
  avg_value: number;
  max_value: number;
  min_value: number;
  sample_count: number;
}

export default function MetricsPage() {
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [hours, setHours] = useState(6);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/metrics?projectId=demo&hours=${hours}`)
      .then((r) => r.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }, [hours]);

  // Group rows by metric name
  const byName = rows.reduce<Record<string, MetricRow[]>>((acc, r) => {
    (acc[r.name] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-100">Metrics</h1>
        <select
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {[1, 3, 6, 12, 24].map((h) => (
            <option key={h} value={h}>Last {h}h</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600 py-12 text-center">Loading…</p>
      ) : Object.keys(byName).length === 0 ? (
        <p className="text-sm text-gray-600 py-12 text-center">No metrics found. Instrument your app with the SDK to start seeing data.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(byName).map(([name, data]) => (
            <MetricChart key={name} title={name} data={data} />
          ))}
        </div>
      )}
    </div>
  );
}
