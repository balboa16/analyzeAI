import Badge from "./Badge";

const statusMap = {
  normal: {
    label: "Норма",
    tone: "normal",
    text: "text-success",
    indicator: "bg-success"
  },
  warning: {
    label: "Погранично",
    tone: "warning",
    text: "text-warning",
    indicator: "bg-warning"
  },
  danger: {
    label: "Отклонение",
    tone: "danger",
    text: "text-danger",
    indicator: "bg-danger"
  }
};

const resolveIndicatorPosition = (note, status) => {
  const value = (note || "").toLowerCase();
  if (value.includes("ниже") || value.includes("низ")) {
    return "12%";
  }
  if (value.includes("выше") || value.includes("повыш")) {
    return "88%";
  }
  if (status === "warning") {
    return "68%";
  }
  if (status === "danger") {
    return "88%";
  }
  return "50%";
};

export default function MetricCard({ metric }) {
  const status = statusMap[metric.status] || statusMap.normal;
  const rangeLabel = metric.range ? `Норма: ${metric.range}` : "Диапазон не указан";
  const indicatorPosition = resolveIndicatorPosition(metric.note, metric.status);
  const valueText = metric.value ? metric.value : "—";

  return (
    <div className="card flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{metric.name}</p>
          <p className="text-xs text-muted">{rangeLabel}</p>
        </div>
        <Badge label={status.label} tone={status.tone} />
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-ink">{valueText}</p>
        <span className="text-xs text-muted">{metric.unit}</span>
      </div>
      <div className="grid gap-2">
        <div className="relative h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]">
          <div className="absolute inset-0 grid grid-cols-3">
            <div className="bg-[var(--warning-soft)]" />
            <div className="bg-[var(--success-soft)]" />
            <div className="bg-[var(--danger-soft)]" />
          </div>
          <span
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${status.indicator}`}
            style={{ left: indicatorPosition }}
          />
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
          <span>Низко</span>
          <span>Норма</span>
          <span>Высоко</span>
        </div>
      </div>
      <p className={`text-xs ${status.text}`}>{metric.note || "См. комментарий"}</p>
    </div>
  );
}
