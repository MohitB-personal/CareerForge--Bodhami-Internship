const {
  validateCandidateRegistration,
  validateCompanyRegistration,
  validateLoginInput,
} = require('../utils/validators');

const handleValidation = (validatorFn) => {
  return (req, res, next) => {
    const { isValid, errors, sanitized } = validatorFn(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the highlighted errors.',
        errors,
      });
    }

    req.sanitizedBody = sanitized;
    next();
  };
};

module.exports = {
  validateCandidateReq: handleValidation(validateCandidateRegistration),
  validateCompanyReq: handleValidation(validateCompanyRegistration),
  validateLoginReq: handleValidation(validateLoginInput),
};
