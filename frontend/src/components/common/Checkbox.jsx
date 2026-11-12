
import PropTypes from 'prop-types';

export default function Checkbox({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-gray-400 cursor-pointer group">
      <div className="relative flex items-center justify-center w-4 h-4 rounded border border-gray-500 group-hover:border-cyan-400 transition-colors">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="opacity-0 absolute inset-0 cursor-pointer peer"
        />
        <div className="w-2 h-2 rounded-sm bg-cyan-400 scale-0 peer-checked:scale-100 transition-transform duration-200" />
      </div>
      {label}
    </label>
  );
}

Checkbox.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
};
