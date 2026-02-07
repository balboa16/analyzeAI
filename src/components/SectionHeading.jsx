export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}) {
  const alignment =
    align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl font-semibold text-ink sm:text-3xl md:text-4xl lg:text-5xl text-balance">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-[70ch] text-sm text-muted sm:text-base md:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
