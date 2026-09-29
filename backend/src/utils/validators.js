const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const validatePhoneInput = (phone) => {
  const strVal = String(phone || '').trim();
  if (!strVal) return 'Phone number is required.';

  // Invalid characters check
  if (!/^[+]?[0-9]+$/.test(strVal)) {
    return 'Phone number can contain only numbers and an optional + at the beginning.';
  }

  // Starts with 0 check (both local 0987..., +0..., and +910...)
  if (strVal.startsWith('0') || strVal.startsWith('+0') || strVal.startsWith('+910')) {
    return 'Phone number should not start with 0.';
  }

  // Length and + format check
  if (strVal.startsWith('+')) {
    const digits = strVal.slice(1);
    if (digits.startsWith('91')) {
      if (digits.length !== 12) {
        return 'Please enter a valid international phone number.';
      }
    } else {
      if (digits.length < 11 || digits.length > 13) {
        return 'Please enter a valid international phone number.';
      }
    }
  } else {
    if (strVal.length !== 10) {
      return 'Please enter a valid 10-digit phone number.';
    }
  }

  return null;
};

const validatePasswordInput = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one alphabet.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[@#$&!]/.test(password)) return 'Password must contain at least one special character (@, #, $, &, or !).';
  return null;
};

/**
 * Validate Candidate Registration Input
 * @param {Object} data Candidate registration request body
 * @returns {Object} { isValid, errors }
 */
const validateCandidateRegistration = (data = {}) => {
  const errors = {};

  const fullName = String(data.fullName || data.name || '').trim();
  const email = String(data.email || '').trim();
  const phone = String(data.phone || '').trim();
  const password = String(data.password || '');

  // Full Name
  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  } else if (!/^[a-zA-Z\s.'-]+$/.test(fullName)) {
    errors.fullName = 'Full name can only contain letters, spaces, hyphens, and periods.';
  }

  // Email
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailPattern.test(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  // Phone
  const phoneError = validatePhoneInput(phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  // Password
  const passwordError = validatePasswordInput(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      fullName,
      email: email.toLowerCase(),
      phone,
      password,
    },
  };
};

/**
 * Validate Company Registration Input
 * @param {Object} data Company registration request body
 * @returns {Object} { isValid, errors }
 */
const validateCompanyRegistration = (data = {}) => {
  const errors = {};

  const companyName = String(data.companyName || data.name || '').trim();
  const companyType = String(data.companyType || data.industry || '').trim();
  const companyEmail = String(data.companyEmail || data.email || '').trim();
  const phone = String(data.phone || '').trim();
  const website = String(data.website || '').trim();
  const gstin = String(data.gstin || '').trim().toUpperCase();
  const pincode = String(data.pincode || '').trim();
  const password = String(data.password || '');

  // Company Name
  if (!companyName) {
    errors.companyName = 'Company name is required.';
  } else if (companyName.length < 2) {
    errors.companyName = 'Company name must be at least 2 characters.';
  }

  // Company Type / Industry
  if (!companyType) {
    errors.companyType = 'Company type / industry sector is required.';
  }

  // Company Email
  if (!companyEmail) {
    errors.companyEmail = 'Company email address is required.';
  } else if (!emailPattern.test(companyEmail)) {
    errors.companyEmail = 'Please provide a valid company email address.';
  }

  // Phone
  const phoneError = validatePhoneInput(phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  // Website (optional or format check if provided)
  if (website && !urlPattern.test(website)) {
    errors.website = 'Please provide a valid website URL (e.g. https://company.com).';
  }

  // GSTIN Validation
  if (!gstin) {
    errors.gstin = 'GSTIN number is required.';
  } else if (gstin.length !== 15) {
    errors.gstin = 'GSTIN must be exactly 15 characters long.';
  } else if (!gstinPattern.test(gstin)) {
    errors.gstin = 'Enter a valid 15-digit GSTIN format (e.g. 22AAAAA0000A1Z5).';
  }

  // Pincode Validation
  if (!pincode) {
    errors.pincode = 'Pincode is required.';
  } else if (!/^\d{6}$/.test(pincode)) {
    errors.pincode = 'Pincode must be exactly 6 digits.';
  }

  // Password
  const passwordError = validatePasswordInput(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      companyName,
      companyType,
      companyEmail: companyEmail.toLowerCase(),
      phone,
      website: website || null,
      gstin,
      pincode,
      password,
    },
  };
};

/**
 * Validate Login Credentials
 * @param {Object} data Login request body
 * @returns {Object} { isValid, errors }
 */
const validateLoginInput = (data = {}) => {
  const errors = {};

  const email = String(data.email || '').trim();
  const password = String(data.password || '');

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailPattern.test(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      email: email.toLowerCase(),
      password,
    },
  };
};

module.exports = {
  validatePhoneInput,
  validatePasswordInput,
  validateCandidateRegistration,
  validateCompanyRegistration,
  validateLoginInput,
};
