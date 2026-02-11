"use client";

import { ChangeEvent } from "react";
import { useRole } from "@/components/RoleProvider";

const DEV_ROLES = ["tendero", "bodega", "repartidor", "admin"] as const;

export default function DevRoleSwitcher() {
  const { role, setRole } = useRole();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextRole = event.target.value as typeof DEV_ROLES[number];
    setRole(nextRole);
  };

  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm sm:flex-row sm:items-center sm:gap-4">
      <label className="flex flex-1 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Rol dev
        <select
          value={role}
          onChange={handleChange}
          className="h-8 w-full rounded-lg border border-slate-300 bg-transparent px-2 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        >
          {DEV_ROLES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">{role}</span>
    </div>
  );
}
