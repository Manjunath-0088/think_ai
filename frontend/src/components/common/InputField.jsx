
import PropTypes from 'prop-types';


function InputField({ label, id, placeholder, type = 'text', ...props }) {
  const cyanFocusGlow = "focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]";

  return (
    <div className="space-y-1.5 lg:space-y-2">
      <label htmlFor={id} className="block text-[10px] lg:text-xs font-semibold tracking-widest text-gray-400 uppercase">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        {...props}
        className={`w-full bg-[#0B0F19]/60 border border-white/10 rounded-lg outline-none
                  text-white placeholder:text-gray-600 
                  px-4 py-2.5 lg:py-3 text-sm lg:text-base
                  transition-all duration-300 ${cyanFocusGlow}`}
      />
    </div>
  );
}

InputField.propTypes = {
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  type: PropTypes.string,
};

export default InputField;
