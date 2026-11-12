
import PropTypes from 'prop-types';

function Button({ label, type = 'button', disabled = false, ...props }) {
  const indigoCyanGradient = "bg-gradient-to-r from-indigo-500 to-cyan-500";
  const establishedShadowGlow = "drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]";

  return (
    <button
      type={type}
      disabled={disabled}
      {...props}
      className={`relative w-full overflow-hidden 
                py-3 lg:py-3.5 rounded-lg
                text-white font-bold tracking-wide text-sm lg:text-base 
                ${indigoCyanGradient} ${establishedShadowGlow}
                transition-all duration-300
                hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]
                active:scale-[0.98]
                disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none`}
    >
      <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-500 ease-in-out" />
      {label}
    </button>
  );
}

Button.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Button;
