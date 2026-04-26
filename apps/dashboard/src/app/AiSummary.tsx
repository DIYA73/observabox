"use client";

import { useState } from "react";

export default function AiSummary({ projectId }: { projectId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, hours: 1 }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-300">AI Incident Analysis</h2>
        <button
          onClick={analyze}
          disabled={loading}
          className="text-xs px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? "Analyzing…" : "Analyze last 1h"}
        </button>
      </div>
      {summary ? (
        <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
      ) : (
        <p className="text-sm text-gray-600 italic">Click analyze to get an AI summary of recent incidents.</p>
      )}
    </div>
  );
}
