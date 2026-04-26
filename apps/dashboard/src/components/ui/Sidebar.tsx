"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import clsx from "clsx";

const NAV = [
  { href: "/",         label: "Overview",  icon: "◈" },
  { href: "/logs",     label: "Logs",      icon: "≡" },
  { href: "/metrics",  label: "Metrics",   icon: "∿" },
  { href: "/traces",   label: "Traces",    icon: "⤚" },
  { href: "/alerts",   label: "Alerts",    icon: "⚑" },
  { href: "/projects", label: "Projects",  icon: "⊞" },
];

interface Project { id: string; name: string; }

function getCookie(name: string) {
  return document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? "";
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.ok ? r.json() : [])
      .then((list: Project[]) => {
        setProjects(list);
        setActiveId(getCookie("ob_project") || list[0]?.id || "");
      });
  }, []);

  function switchProject(id: string) {
    document.cookie = `ob_project=${id}; path=/; max-age=${60 * 60 * 24 * 7}`;
    setActiveId(id);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const active = projects.find((p) => p.id === activeId);

  return (
    <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="px-5 py-4 border-b border-gray-800">
        <span className="text-brand-500 font-bold text-lg tracking-tight">ObservaBox</span>
      </div>

      {/* Project switcher */}
      {projects.length > 0 && (
        <div className="px-3 pt-3">
          <select
            value={activeId}
            onChange={(e) => switchProject(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {active && (
            <p className="text-[10px] text-gray-600 mt-1 px-1 truncate">ID: {active.id}</p>
          )}
        </div>
      )}

      <nav className="flex-1 px-3 py-3 space-y-1">
        {NAV.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === l.href
                ? "bg-brand-500/20 text-brand-400 font-medium"
                : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            )}
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
        >
          ↩ Sign out
        </button>
        <p className="text-[10px] text-gray-700 px-3 mt-1">v0.1.0</p>
      </div>
    </aside>
  );
}
