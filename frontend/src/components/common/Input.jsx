import { AlertCircle } from 'lucide-react';

export const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  disabled = false,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  rightIconLabel,
}) => {
  const hasError = touched && error;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={name} 
          className={`label ${required ? 'label-required' : ''}`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Icon size={20} />
          </div>
        )}

        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            aria-label={rightIconLabel}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <RightIcon size={18} />
          </button>
        )}
        
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            input-field
            ${Icon ? 'pl-11' : ''}
            ${RightIcon ? 'pr-11' : ''}
            ${hasError ? 'input-error' : ''}
          `}
        />
      </div>
      
      {hasError && (
        <div className="error-message">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
