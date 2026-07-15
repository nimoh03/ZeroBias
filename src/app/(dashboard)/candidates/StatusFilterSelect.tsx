"use client";

export default function StatusFilterSelect({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="w-full h-full bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm text-sm font-medium text-on-surface-variant cursor-pointer appearance-none hover:border-primary transition-colors outline-none pl-11"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}