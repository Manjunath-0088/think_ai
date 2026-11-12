import "./Card.css";
import { Button } from "./Button";

/**
 * Ticket-stub styled card. Pairs naturally with `Button` in the footer
 * as the "tear here" action.
 */
export const Card = ({
  eyebrow = "Event",
  title = "Untitled",
  meta = "",
  variant = "teal", // teal | amber | danger
  actionLabel = "Book ticket",
  onAction,
}) => {
  const variantClass =
    variant === "amber"
      ? "tk-card--variant-amber"
      : variant === "danger"
      ? "tk-card--variant-danger"
      : "";

  return (
    <div className={["tk-card", variantClass].filter(Boolean).join(" ")}>
      <span className="tk-card__eyebrow">{eyebrow}</span>
      <h3 className="tk-card__title">{title}</h3>
      {meta ? <span className="tk-card__meta">{meta}</span> : null}
      <div className="tk-card__footer">
        <Button label={actionLabel} size="sm" onClick={onAction} />
      </div>
    </div>
  );
};

export default Card;