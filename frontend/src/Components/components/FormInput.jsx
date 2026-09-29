import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function FormInput({
  label,
  name,
  type = "text",
  placeholder = "",
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  icon: Icon = null,
  fullWidth = false,
  autoComplete,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

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

      <div className={`input-container ${Icon ? "has-icon" : ""} ${isPassword ? "has-action" : ""}`}>
        {Icon && (
          <div className="input-icon">
            <Icon size={18} />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={`form-control ${error ? "is-invalid" : ""}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="input-action-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            title={showPassword ? "Hide password" : "Show password"}
            tabIndex="-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <p className="error-message">
          <AlertCircle size={14} />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="helper-text">{helperText}</p>
      ) : null}
    </div>
  );
}
