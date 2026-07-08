"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export type AdminSelectOption = {
  value: string;
  label: string;
};

type AdminSelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Show a search field when the list is long. Defaults to true above 6 options. */
  searchable?: boolean;
  searchPlaceholder?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
};

const MENU_GAP = 6;
const MENU_MAX_HEIGHT = 224;
const MENU_MAX_HEIGHT_SEARCHABLE = 320;
const SEARCHABLE_THRESHOLD = 6;

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function getMenuPosition(
  trigger: HTMLElement,
  searchable: boolean
): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
  const spaceAbove = rect.top - MENU_GAP;
  const preferredHeight = searchable ? MENU_MAX_HEIGHT_SEARCHABLE : MENU_MAX_HEIGHT;
  const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;

  const maxHeight = Math.min(
    preferredHeight,
    openUpward ? spaceAbove : spaceBelow
  );

  return {
    top: openUpward ? rect.top - MENU_GAP : rect.bottom + MENU_GAP,
    left: rect.left,
    width: rect.width,
    maxHeight: Math.max(maxHeight, searchable ? 160 : 120),
    placement: openUpward ? "top" : "bottom",
  };
}

export default function AdminSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  className,
  searchable,
  searchPlaceholder = "Search…",
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const isSearchable =
    searchable ?? options.length > SEARCHABLE_THRESHOLD;

  const selected = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    if (!isSearchable || !query) return options;
    const normalized = normalizeSearch(query);
    return options.filter((option) =>
      normalizeSearch(option.label).includes(normalized)
    );
  }, [isSearchable, options, query]);

  function syncMenuPosition() {
    if (!rootRef.current) return;
    setMenuPosition(getMenuPosition(rootRef.current, isSearchable));
  }

  function closeMenu() {
    setOpen(false);
    setQuery("");
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      setQuery("");
      return;
    }

    syncMenuPosition();
    if (isSearchable) {
      searchRef.current?.focus();
    }
  }, [open, options.length, isSearchable]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        closeMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    function handleReposition() {
      syncMenuPosition();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, isSearchable]);

  function renderOptions() {
    if (filteredOptions.length === 0) {
      return (
        <li role="presentation">
          <p className="px-3 py-4 text-center text-sm text-sand-muted">
            No matches for &ldquo;{query}&rdquo;
          </p>
        </li>
      );
    }

    return filteredOptions.map((option) => {
      const isSelected = option.value === value;

      return (
        <li key={option.value || "__none__"} role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => {
              onChange(option.value);
              closeMenu();
            }}
            className="admin-select-option"
            data-selected={isSelected}
          >
            <span>{option.label}</span>
            {isSelected && <Check size={14} className="text-teal" />}
          </button>
        </li>
      );
    });
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      {label && <label className="form-label">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={selected?.label ?? label ?? placeholder}
        onClick={() => setOpen((current) => !current)}
        className="admin-select-trigger"
      >
        <span className={selected ? "text-sand" : "text-sand-muted"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-teal transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        menuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="admin-select-menu admin-select-menu-portal"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
              transform:
                menuPosition.placement === "top"
                  ? "translateY(-100%)"
                  : undefined,
            }}
          >
            {isSearchable && (
              <div className="admin-select-search">
                <Search size={14} className="shrink-0 text-teal" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="admin-select-search-input"
                  aria-label={searchPlaceholder}
                />
              </div>
            )}

            <ul
              id={listboxId}
              role="listbox"
              aria-label={label}
              className="admin-select-options"
            >
              {renderOptions()}
            </ul>

            {isSearchable && (
              <p className="admin-select-footer">
                {query
                  ? `${filteredOptions.length} of ${options.length} shown`
                  : `${options.length} options`}
              </p>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
