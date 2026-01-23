export default function InputField({ id, label, hint, ...props }) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-ink" htmlFor={id}>
      {label}
      <input
        id={id}
        className="w-full rounded-2xl border border-stroke bg-white px-4 py-3 text-base text-ink shadow-sm focus:border-accent focus:outline-none"
        {...props}
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
