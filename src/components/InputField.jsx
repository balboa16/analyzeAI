export default function InputField({ id, label, hint, ...props }) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-ink" htmlFor={id}>
      {label}
      <input
        id={id}
        className="w-full rounded-[12px] border border-stroke bg-white px-4 py-3 text-sm text-ink shadow-sm transition focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        {...props}
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
