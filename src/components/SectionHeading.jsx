export default function SectionHeading({ eyebrow, title, subtitle, align = "left" }) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow ? (
        <span className="pill uppercase tracking-[0.2em]">{eyebrow}</span>
      ) : null}
      <h2 className="text-3xl font-semibold text-ink md:text-4xl lg:text-5xl text-balance">{title}</h2>
      {subtitle ? (
        <p className="max-w-2xl text-base text-muted md:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}
