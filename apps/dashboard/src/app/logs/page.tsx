"use client";

import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";

interface LogRow {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  trace_id: string;
  meta: string;
}

const LEVEL_COLORS: Record<string, string> = {
  debug: "text-gray-500",
  info:  "text-blue-400",
  warn:  "text-yellow-400",
  error: "text-red-400",
  fatal: "text-red-600 font-bold",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ projectId: "demo", limit: "200" });
    if (level) params.set("level", level);
    if (search) params.set("search", search);
    const res = await fetch(`/api/logs?${params}`);
    setLogs(await res.json());
    setLoading(false);
  }, [level, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-100">Logs</h1>
        <button onClick={fetchLogs} className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-300 transition-colors">
          Refresh
        </button>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search messages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All levels</option>
          {["debug","info","warn","error","fatal"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-600 py-12 text-sm">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-600 py-12 text-sm">No logs found.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="border-b border-gray-800 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2 w-44">Timestamp</th>
                <th className="text-left px-4 py-2 w-16">Level</th>
                <th className="text-left px-4 py-2 w-28">Service</th>
                <th className="text-left px-4 py-2">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className={clsx("px-4 py-2 uppercase", LEVEL_COLORS[log.level] ?? "text-gray-400")}>
                    {log.level}
                  </td>
                  <td className="px-4 py-2 text-gray-400 truncate max-w-[7rem]">{log.service}</td>
                  <td className="px-4 py-2 text-gray-200 truncate max-w-md">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
