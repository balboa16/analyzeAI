import Badge from "./Badge";

const statusCopy = {
  normal: {
    label: "Зелёный",
    title: "Серьёзных отклонений не выявлено",
  },
  warning: {
    label: "Жёлтый",
    title: "Есть показатели вне нормы",
  },
  danger: {
    label: "Красный",
    title: "Есть значимые отклонения",
  },
};

export default function ResultSummary({ status = "normal", insights = [] }) {
  const copy = statusCopy[status] || statusCopy.normal;

  return (
    <div className="card bg-[var(--bg-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Краткий вывод
          </p>
          <h3 className="mt-3 text-xl text-ink sm:text-2xl">{copy.title}</h3>
        </div>
        <Badge label={copy.label} tone={status} />
      </div>
      {insights.length ? (
        <ul className="mt-4 grid gap-2 text-sm text-muted">
          {insights.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-2 inline-flex h-2 w-2 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
