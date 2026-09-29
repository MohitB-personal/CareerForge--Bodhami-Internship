import React from "react";
import { AlertCircle } from "lucide-react";

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = "Select an option",
  error,
  required = false,
  icon: Icon = null,
  fullWidth = false,
  className = "",
  ...props
}) {
  return (
    <div className={`form-group ${fullWidth ? "full-width" : ""} ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          <span>
            {label}
            {required && <span className="required-star">*</span>}
          </span>
        </label>
      )}

      <div className={`input-container ${Icon ? "has-icon" : ""}`}>
        {Icon && (
          <div className="input-icon">
            <Icon size={18} />
          </div>
        )}

        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          className={`form-control ${error ? "is-invalid" : ""}`}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="error-message">
          <AlertCircle size={14} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
