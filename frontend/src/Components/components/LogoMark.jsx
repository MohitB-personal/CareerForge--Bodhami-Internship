import React from "react";
import cfLogo from "../../assets/cf-logo-trim.png";

/**
 * CareerForge brand logo — uses the official logo image EXACTLY as provided
 * (src/assets/cf-logo-trim.png). Do not redraw or modify the mark.
 *
 * Props:
 *  - height: height of the logo in px (width scales from the 1152x337 aspect)
 */
export default function LogoMark({ height = 34, ...props }) {
  return (
    <img
      src={cfLogo}
      alt="CareerForge"
      style={{
        height,
        width: "auto",
        display: "block",
        flexShrink: 0,
        borderRadius: 6,
      }}
      {...props}
    />
  );
}
