import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  icon: Icon = null,
  iconPosition = "left",
  ...props
}) {
  const sizeClass = size === "lg" ? "btn-lg" : size === "sm" ? "btn-sm" : "";
  const fullClass = fullWidth ? "btn-full" : "";
  const variantClass = `btn-${variant}`;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${fullClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner" style={{
            display: "inline-block",
            width: "16px",
            height: "16px",
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.65s linear infinite"
          }} />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={18} />}
          <span>{children}</span>
          {Icon && iconPosition === "right" && <Icon size={18} />}
        </>
      )}
    </button>
  );
}
