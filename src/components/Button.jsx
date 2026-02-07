export default function Button({
  as: Component = "button",
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const variantClass =
    {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      whatsapp: "btn-whatsapp",
    }[variant] || "btn-primary";

  return (
    <Component className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
