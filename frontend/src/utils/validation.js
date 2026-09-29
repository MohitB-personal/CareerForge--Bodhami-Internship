export const requiredMessage = "This field is required.";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
// GSTIN: 15 alphanumeric characters (Standard Indian GST structure: 2 digits + 10 char PAN + 1 entity num + Z + 1 check digit)
const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Validate Phone Number:
 * - Without '+': exactly 10 digits, numbers only, cannot start with 0 (e.g. 9876543210 ✅)
 * - With '+': '+' must be first char, followed only by digits. For Indian numbers, +91 followed by exactly 10 digits (e.g. +919876543210 ✅)
 * - Messages:
 *   - Invalid characters: "Phone number can contain only numbers and an optional + at the beginning."
 *   - Starts with 0: "Phone number should not start with 0."
 *   - Invalid length: "Please enter a valid 10-digit phone number."
 *   - Invalid + format: "Please enter a valid international phone number."
 */
export function validatePhoneNumber(phone) {
  const strVal = String(phone || "").trim();
  if (!strVal) return requiredMessage;

  // Invalid characters check
  if (!/^[+]?[0-9]+$/.test(strVal)) {
    return "Phone number can contain only numbers and an optional + at the beginning.";
  }

  // Starts with 0 check (both local 0987..., +0..., and +910...)
  if (strVal.startsWith("0") || strVal.startsWith("+0") || strVal.startsWith("+910")) {
    return "Phone number should not start with 0.";
  }

  // Length and + format check
  if (strVal.startsWith("+")) {
    const digits = strVal.slice(1);
    if (digits.startsWith("91")) {
      if (digits.length !== 12) {
        return "Please enter a valid international phone number.";
      }
    } else {
      if (digits.length < 11 || digits.length > 13) {
        return "Please enter a valid international phone number.";
      }
    }
  } else {
    if (strVal.length !== 10) {
      return "Please enter a valid 10-digit phone number.";
    }
  }

  return "";
}

/**
 * Validate Password:
 * - At least 8 characters long
 * - At least 1 alphabet (A-Z or a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character from @ # $ & !
 * Messages:
 * - Less than 8 characters: "Password must be at least 8 characters long."
 * - No alphabet: "Password must contain at least one alphabet."
 * - No number: "Password must contain at least one number."
 * - No required special character: "Password must contain at least one special character (@, #, $, &, or !)."
 */
export function validatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "", message: requiredMessage };
  }

  if (password.length < 8) {
    return { score: 1, label: "Weak", message: "Password must be at least 8 characters long." };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { score: 1, label: "Weak", message: "Password must contain at least one alphabet." };
  }
  if (!/[0-9]/.test(password)) {
    return { score: 2, label: "Weak", message: "Password must contain at least one number." };
  }
  if (!/[@#$&!]/.test(password)) {
    return { score: 2, label: "Weak", message: "Password must contain at least one special character (@, #, $, &, or !)." };
  }

  let score = 3;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;

  return { score: Math.min(score, 5), label: score >= 4 ? "Strong" : "Medium", message: "" };
}

export function validateCandidateField(name, value, values = {}) {
  const strVal = String(value || "").trim();
  
  if (name === "terms") {
    if (!value) return "You must agree to the Terms of Service and Privacy Policy.";
    return "";
  }
  
  if (!strVal) return requiredMessage;

  switch (name) {
    case "fullName":
      if (strVal.length < 2) return "Full name must be at least 2 characters.";
      if (!/^[a-zA-Z\s.'-]+$/.test(strVal)) return "Enter a valid name containing letters.";
      break;

    case "email":
      if (!emailPattern.test(strVal)) return "Enter a valid email address (e.g. john@example.com).";
      break;

    case "phone":
      return validatePhoneNumber(strVal);

    case "password":
      return validatePasswordStrength(strVal).message;

    case "confirmPassword":
      if (strVal !== values.password) return "Passwords do not match.";
      break;

    default:
      break;
  }
  return "";
}

export function validateCompanyField(name, value, values = {}) {
  const strVal = String(value || "").trim();
  
  if (name === "terms") {
    if (!value) return "You must agree to the Terms of Service and Privacy Policy.";
    return "";
  }

  if (!strVal) return requiredMessage;

  switch (name) {
    case "companyName":
      if (strVal.length < 2) return "Company name must be at least 2 characters.";
      break;

    case "companyType":
      if (!strVal) return "Please select a company industry/type.";
      break;

    case "companyEmail":
    case "email":
      if (!emailPattern.test(strVal)) return "Enter a valid company email address.";
      break;

    case "phone":
      return validatePhoneNumber(strVal);

    case "website":
      if (!urlPattern.test(strVal)) return "Enter a valid website URL (e.g. https://company.com).";
      break;

    case "gstin":
      const upperGST = strVal.toUpperCase();
      if (upperGST.length !== 15) return "GSTIN must be exactly 15 characters long.";
      if (!gstinPattern.test(upperGST)) return "Enter a valid 15-digit GSTIN format (e.g. 22AAAAA0000A1Z5).";
      break;

    case "password":
      return validatePasswordStrength(strVal).message;

    case "confirmPassword":
      if (strVal !== values.password) return "Passwords do not match.";
      break;

    default:
      break;
  }
  return "";
}

export function validateCandidateForm(values) {
  const errors = {};
  const fields = ["fullName", "email", "phone", "password", "confirmPassword", "terms"];
  fields.forEach(field => {
    const error = validateCandidateField(field, values[field], values);
    if (error) errors[field] = error;
  });
  return errors;
}

export function validateCompanyForm(values) {
  const errors = {};
  const fields = ["companyName", "companyType", "companyEmail", "phone", "website", "gstin", "password", "confirmPassword", "terms"];
  fields.forEach(field => {
    const error = validateCompanyField(field, values[field], values);
    if (error) errors[field] = error;
  });
  return errors;
}

export function validateLoginForm(values) {
  const errors = {};
  if (!values.email?.trim()) {
    errors.email = requiredMessage;
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.password) {
    errors.password = requiredMessage;
  }
  return errors;
}
