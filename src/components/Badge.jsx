export default function Badge({ label, tone = "normal" }) {
  const styles = {
    normal: "badge badge-success",
    warning: "badge badge-warning",
    danger: "badge badge-danger"
  };

  return (
    <span className={styles[tone] || styles.normal}>
      {label}
    </span>
  );
}
