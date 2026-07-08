"use client";

import { Search } from "lucide-react";

type AdminSearchProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function AdminSearch({
  label,
  value,
  onChange,
  placeholder = "Search…",
  className,
}: AdminSearchProps) {
  return (
    <div className={className}>
      {label ? <label className="form-label">{label}</label> : null}
      <div className="admin-field-input">
        <Search size={14} className="shrink-0 text-teal" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="admin-field-input-control"
        />
      </div>
    </div>
  );
}
