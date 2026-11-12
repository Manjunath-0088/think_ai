import "./Button.css";

/**
 * Ticket-punch styled button. The small circular "hole" on the left acts
 * as an idle marker at rest and turns into a spinner while `loading`.
 */
export const Button = ({
  label = "Button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const classes = [
    "tk-btn",
    `tk-btn--${variant}`,
    `tk-btn--${size}`,
    loading ? "tk-btn--loading" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      disabled={isDisabled}
      aria-busy={loading}
      onClick={onClick}
      {...rest}
    >
      <span className="tk-btn__hole" aria-hidden="true" />
      <span className={loading ? "tk-btn__label--loading" : undefined}>
        {loading ? "Punching…" : label}
      </span>
    </button>
  );
};

export default Button;