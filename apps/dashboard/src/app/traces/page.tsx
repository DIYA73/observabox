"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

interface TraceRow {
  trace_id: string;
  span_id: string;
  name: string;
  service: string;
  start_time: string;
  duration_ms: number;
  status: string;
}

interface SpanRow extends TraceRow {
  parent_span_id: string;
  end_time: string;
  attributes: string;
}

const STATUS_COLORS: Record<string, string> = {
  ok:    "text-green-400",
  error: "text-red-400",
  unset: "text-gray-500",
};

export default function TracesPage() {
  const [traces, setTraces] = useState<TraceRow[]>([]);
  const [spans, setSpans] = useState<SpanRow[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [hours, setHours] = useState(6);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/traces?projectId=demo&hours=${hours}`)
      .then((r) => r.json())
      .then(setTraces)
      .finally(() => setLoading(false));
  }, [hours]);

  async function openTrace(traceId: string) {
    setSelectedTrace(traceId);
    const res = await fetch(`/api/traces?projectId=demo&traceId=${traceId}`);
    setSpans(await res.json());
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-100">Traces</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trace list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <p className="text-xs uppercase text-gray-500 tracking-wider px-4 py-2 border-b border-gray-800">Root Spans</p>
          {loading ? (
            <p className="text-center text-gray-600 py-8 text-sm">Loading…</p>
          ) : traces.length === 0 ? (
            <p className="text-center text-gray-600 py-8 text-sm">No traces found.</p>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {traces.map((t) => (
                <button
                  key={t.span_id}
                  onClick={() => openTrace(t.trace_id)}
                  className={clsx(
                    "w-full text-left px-4 py-3 hover:bg-gray-800/50 transition-colors text-xs",
                    selectedTrace === t.trace_id && "bg-gray-800"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-200 truncate">{t.name}</span>
                    <span className={clsx("ml-2 shrink-0", STATUS_COLORS[t.status])}>{t.status}</span>
                  </div>
                  <div className="text-gray-500 mt-0.5 flex gap-3">
                    <span>{t.service}</span>
                    <span>{t.duration_ms.toFixed(1)}ms</span>
                    <span>{new Date(t.start_time).toLocaleTimeString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Span detail */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <p className="text-xs uppercase text-gray-500 tracking-wider px-4 py-2 border-b border-gray-800">
            {selectedTrace ? `Spans for ${selectedTrace.slice(0, 16)}…` : "Select a trace"}
          </p>
          {spans.length === 0 ? (
            <p className="text-center text-gray-600 py-8 text-sm">
              {selectedTrace ? "No spans found." : "Click a trace to inspect spans."}
            </p>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {spans.map((s) => (
                <div key={s.span_id} className="px-4 py-3 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-200">{s.name}</span>
                    <span className={STATUS_COLORS[s.status]}>{s.duration_ms.toFixed(1)}ms</span>
                  </div>
                  <div className="text-gray-500 mt-0.5">{s.service} · {s.span_id.slice(0, 12)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
