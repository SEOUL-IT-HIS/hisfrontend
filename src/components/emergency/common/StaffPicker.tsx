"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { PickerGroup, PickerOption } from "@/features/emergency/common/staffOptions";

type StaffPickerProps = {
  /** 라벨 요소의 id (접근성) */
  labelId: string;
  value: string;
  onChange: (value: string) => void;
  groups: PickerGroup[];
  /** 부서 묶음 위에 따로 놓는 줄 */
  pinned: PickerOption[];
  /** 값이 없을 때 닫힌 칸에 보이는 안내 글자(목록에는 들어가지 않는다) */
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
};

const TAG_TONE = {
  doctor: "bg-sky-50 text-sky-700",
  nurse: "bg-emerald-50 text-emerald-700",
} as const;

/** 이 개수를 넘으면 목록 위에 검색칸을 보여준다 */
const SEARCH_THRESHOLD = 7;

function OptionLabel({ option }: { option: PickerOption }) {
  return (
    <>
      <span className="min-w-0 truncate">{option.name}</span>
      {option.isMe ? <span className="shrink-0 text-xs text-slate-400">(me)</span> : null}
      {option.empNo ? <span className="shrink-0 text-xs text-slate-400">({option.empNo})</span> : null}
      {option.tag ? (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${TAG_TONE[option.tagTone ?? "doctor"]}`}>
          {option.tag}
        </span>
      ) : null}
    </>
  );
}

/**
 * 직원 선택 드롭다운.
 * 브라우저 기본 select 는 열리는 방향(공간이 모자라면 위로 열린다)과 모양을 정할 수 없어 직접 만들었다.
 * 목록은 항상 칸 바로 아래로만 열리고, 부서별로 묶여 보이며, 항목이 많으면 검색칸이 나온다.
 * 키보드: ↑↓ 이동, Enter 선택, Esc 닫기.
 */
export default function StaffPicker({ labelId, value, onChange, groups, pinned, placeholder, loading = false, disabled = false }: StaffPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const all = useMemo(() => [...pinned, ...groups.flatMap((group) => group.options)], [pinned, groups]);
  const selected = all.find((option) => option.value === value);
  // 값이 빈 줄("선택 안 함")은 닫힌 칸에서는 안내 글자처럼 보여준다
  const hasValue = !!selected && selected.value !== "";
  const showSearch = all.length > SEARCH_THRESHOLD;

  const needle = query.trim().toLowerCase();
  const matches = (option: PickerOption) => !needle || option.searchText.includes(needle);
  const visiblePinned = pinned.filter(matches);
  const visibleGroups = groups
    .map((group) => ({ ...group, options: group.options.filter(matches) }))
    .filter((group) => group.options.length > 0);
  const flat = [...visiblePinned, ...visibleGroups.flatMap((group) => group.options)];

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // 열리면 키보드를 받을 곳으로 포커스하고, 화면 아래쪽에서 열렸으면 목록 전체가 보이도록 필요한 만큼만 스크롤한다
  useEffect(() => {
    if (!open) return;
    (showSearch ? searchRef.current : panelRef.current)?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({ block: "nearest" });
  }, [open, showSearch]);

  // 키보드로 움직일 때 선택된 줄이 보이게
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openPanel() {
    if (disabled || loading) return;
    setQuery("");
    setActive(Math.max(0, all.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  function choose(option: PickerOption) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openPanel();
      else setActive((index) => Math.min(index + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (open) setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const option = flat[active];
      if (option) choose(option);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  // 화면에 보이는 순서대로 번호를 매겨 둔다(키보드 이동·강조에 쓴다)
  const indexOf = new Map(flat.map((option, index) => [option.value, index]));
  const renderOption = (option: PickerOption) => {
    const index = indexOf.get(option.value) ?? 0;
    const isSelected = option.value === value;
    return (
      <li
        key={option.value}
        role="option"
        aria-selected={isSelected}
        data-index={index}
        onMouseEnter={() => setActive(index)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => choose(option)}
        className={`flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-sm ${
          index === active ? "bg-sky-50" : ""
        } ${isSelected ? "font-medium text-sky-700" : "text-slate-700"}`}
      >
        <span className="w-4 shrink-0 text-sky-600">{isSelected ? "✓" : ""}</span>
        <OptionLabel option={option} />
      </li>
    );
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        disabled={disabled || loading}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selected && hasValue ? <OptionLabel option={selected} /> : <span className="truncate text-slate-400">{loading ? "Loading..." : selected ? selected.name : placeholder}</span>}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg outline-none"
        >
          {showSearch ? (
            <div className="border-b border-slate-100 p-2">
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                placeholder="Search name"
                className="h-8 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-400"
              />
            </div>
          ) : null}
          <ul ref={listRef} role="listbox" aria-labelledby={labelId} className="max-h-64 overflow-y-auto py-1">
            {flat.length === 0 ? <li className="px-3 py-2 text-sm text-slate-400">No matches</li> : null}
            {visiblePinned.map(renderOption)}
            {visibleGroups.map((group) => (
              <li key={group.key} role="presentation">
                {group.label ? (
                  <p
                    className={`px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide ${
                      group.highlight ? "text-sky-600" : "text-slate-400"
                    }`}
                  >
                    {group.label}
                  </p>
                ) : null}
                <ul role="group" aria-label={group.label}>
                  {group.options.map(renderOption)}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
