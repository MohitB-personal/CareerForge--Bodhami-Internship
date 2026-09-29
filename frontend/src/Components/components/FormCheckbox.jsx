import React from "react";
import { AlertCircle } from "lucide-react";

export default function FormCheckbox({
  name,
  checked,
  onChange,
  label,
  error,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`checkbox-wrapper ${className}`}>
      <label className="checkbox-container">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="checkbox-input"
          {...props}
        />
        <span className="checkbox-label">
          {label}
          {required && <span className="required-star">*</span>}
        </span>
      </label>

      {error && (
        <p className="error-message" style={{ marginTop: "-12px", marginBottom: "16px" }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
