const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const {
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
} = require('../src/controllers/authController');
const { saveOTP, getOTP } = require('../src/utils/otpService');
const CandidateModel = require('../src/models/candidateModel');
const CompanyModel = require('../src/models/companyModel');

// Helper to mock Express req, res
const createMockReqRes = (body = {}) => {
  const req = { body };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData,
  };
};

test('requestPasswordResetOTP rejects missing or invalid inputs', async () => {
  // Missing email & role
  const mock1 = createMockReqRes({});
  await requestPasswordResetOTP(mock1.req, mock1.res, () => {});
  assert.equal(mock1.getStatus(), 400);
  assert.equal(mock1.getData().success, false);

  // Invalid role
  const mock2 = createMockReqRes({ email: 'test@example.com', role: 'admin' });
  await requestPasswordResetOTP(mock2.req, mock2.res, () => {});
  assert.equal(mock2.getStatus(), 400);
  assert.equal(mock2.getData().success, false);
});

test('requestPasswordResetOTP returns 404 for non-existent accounts', async () => {
  const originalFindCandidate = CandidateModel.findByEmail;
  CandidateModel.findByEmail = async () => null;

  try {
    const mock = createMockReqRes({ email: 'nonexistent@example.com', role: 'candidate' });
    await requestPasswordResetOTP(mock.req, mock.res, () => {});
    assert.equal(mock.getStatus(), 404);
    assert.equal(mock.getData().success, false);
    assert.match(mock.getData().message, /no account found/i);
  } finally {
    CandidateModel.findByEmail = originalFindCandidate;
  }
});

test('requestPasswordResetOTP generates and saves OTP when account exists', async () => {
  const originalFindCandidate = CandidateModel.findByEmail;
  CandidateModel.findByEmail = async (email) => ({
    id: 999,
    full_name: 'Test Candidate',
    email,
  });

  try {
    const email = 'candidate.reset@example.com';
    const mock = createMockReqRes({ email, role: 'candidate' });
    await requestPasswordResetOTP(mock.req, mock.res, () => {});
    assert.equal(mock.getStatus(), 200);
    assert.equal(mock.getData().success, true);

    const saved = getOTP(email, 'candidate', 'password_reset');
    assert.ok(saved);
    assert.match(saved.otp, /^\d{6}$/);
    assert.equal(saved.userId, 999);
  } finally {
    CandidateModel.findByEmail = originalFindCandidate;
  }
});

test('verifyPasswordResetOTP validates OTP and enforces single-use', async () => {
  const email = 'user.verify@example.com';
  const role = 'candidate';
  const otp = '654321';

  saveOTP(email, otp, { role, purpose: 'password_reset', userId: 101 });

  // Wrong OTP
  const mockWrong = createMockReqRes({ email, role, otp: '111111' });
  await verifyPasswordResetOTP(mockWrong.req, mockWrong.res, () => {});
  assert.equal(mockWrong.getStatus(), 400);
  assert.equal(mockWrong.getData().success, false);

  // Correct OTP
  const mockCorrect = createMockReqRes({ email, role, otp });
  await verifyPasswordResetOTP(mockCorrect.req, mockCorrect.res, () => {});
  assert.equal(mockCorrect.getStatus(), 200);
  assert.equal(mockCorrect.getData().success, true);
  assert.ok(mockCorrect.getData().resetToken);

  // Single-use check: OTP cannot be verified twice
  const mockReuse = createMockReqRes({ email, role, otp });
  await verifyPasswordResetOTP(mockReuse.req, mockReuse.res, () => {});
  assert.equal(mockReuse.getStatus(), 400);
  assert.equal(mockReuse.getData().success, false);
});

test('resetPassword enforces password validation and confirm password matching', async () => {
  const email = 'user.rules@example.com';
  const role = 'candidate';
  const otp = '777888';
  saveOTP(email, otp, { role, purpose: 'password_reset', userId: 202 });

  const mockVerify = createMockReqRes({ email, role, otp });
  await verifyPasswordResetOTP(mockVerify.req, mockVerify.res, () => {});
  const resetToken = mockVerify.getData().resetToken;
  assert.ok(resetToken);

  // Mismatched confirmPassword
  const mockMismatch = createMockReqRes({
    email,
    role,
    resetToken,
    newPassword: 'Password1!',
    confirmPassword: 'Password2!',
  });
  await resetPassword(mockMismatch.req, mockMismatch.res, () => {});
  assert.equal(mockMismatch.getStatus(), 400);
  assert.match(mockMismatch.getData().message, /passwords do not match/i);

  // Too short (< 8 chars)
  const mockShort = createMockReqRes({
    email,
    role,
    resetToken,
    newPassword: 'Pass1!',
    confirmPassword: 'Pass1!',
  });
  await resetPassword(mockShort.req, mockShort.res, () => {});
  assert.equal(mockShort.getStatus(), 400);
  assert.match(mockShort.getData().message, /at least 8 characters/i);

  // Missing special char from @#$&!
  const mockNoSpecial = createMockReqRes({
    email,
    role,
    resetToken,
    newPassword: 'Password123',
    confirmPassword: 'Password123',
  });
  await resetPassword(mockNoSpecial.req, mockNoSpecial.res, () => {});
  assert.equal(mockNoSpecial.getStatus(), 400);
  assert.match(mockNoSpecial.getData().message, /special character/i);

  // Missing number
  const mockNoNum = createMockReqRes({
    email,
    role,
    resetToken,
    newPassword: 'Password!@',
    confirmPassword: 'Password!@',
  });
  await resetPassword(mockNoNum.req, mockNoNum.res, () => {});
  assert.equal(mockNoNum.getStatus(), 400);
  assert.match(mockNoNum.getData().message, /number/i);
});

test('resetPassword updates candidate password and enforces token single-use', async () => {
  let updatedUserId = null;
  let updatedPasswordHash = null;

  const originalUpdate = CandidateModel.updatePassword;
  CandidateModel.updatePassword = async (id, hash) => {
    updatedUserId = id;
    updatedPasswordHash = hash;
    return true;
  };

  try {
    const email = 'candidate.final@example.com';
    const role = 'candidate';
    const otp = '123456';
    saveOTP(email, otp, { role, purpose: 'password_reset', userId: 505 });

    const mockVerify = createMockReqRes({ email, role, otp });
    await verifyPasswordResetOTP(mockVerify.req, mockVerify.res, () => {});
    const resetToken = mockVerify.getData().resetToken;

    const validNewPassword = 'SecurePassword@2026';
    const mockReset = createMockReqRes({
      email,
      role,
      resetToken,
      newPassword: validNewPassword,
      confirmPassword: validNewPassword,
    });

    await resetPassword(mockReset.req, mockReset.res, () => {});
    assert.equal(mockReset.getStatus(), 200);
    assert.equal(mockReset.getData().success, true);
    assert.equal(updatedUserId, 505);
    assert.ok(bcrypt.compareSync(validNewPassword, updatedPasswordHash));

    // Token reuse check: the token cannot be used a second time
    const mockReuse = createMockReqRes({
      email,
      role,
      resetToken,
      newPassword: validNewPassword,
      confirmPassword: validNewPassword,
    });
    await resetPassword(mockReuse.req, mockReuse.res, () => {});
    assert.equal(mockReuse.getStatus(), 400);
    assert.equal(mockReuse.getData().success, false);
  } finally {
    CandidateModel.updatePassword = originalUpdate;
  }
});

test('resetPassword updates company password successfully', async () => {
  let updatedCompanyId = null;
  let updatedPasswordHash = null;

  const originalUpdate = CompanyModel.updatePassword;
  CompanyModel.updatePassword = async (id, hash) => {
    updatedCompanyId = id;
    updatedPasswordHash = hash;
    return true;
  };

  try {
    const email = 'hr@companycorp.com';
    const role = 'company';
    const otp = '987654';
    saveOTP(email, otp, { role, purpose: 'password_reset', userId: 808 });

    const mockVerify = createMockReqRes({ email, role, otp });
    await verifyPasswordResetOTP(mockVerify.req, mockVerify.res, () => {});
    const resetToken = mockVerify.getData().resetToken;

    const validNewPassword = 'Company#Secret99';
    const mockReset = createMockReqRes({
      email,
      role,
      resetToken,
      newPassword: validNewPassword,
      confirmPassword: validNewPassword,
    });

    await resetPassword(mockReset.req, mockReset.res, () => {});
    assert.equal(mockReset.getStatus(), 200);
    assert.equal(mockReset.getData().success, true);
    assert.equal(updatedCompanyId, 808);
    assert.ok(bcrypt.compareSync(validNewPassword, updatedPasswordHash));
  } finally {
    CompanyModel.updatePassword = originalUpdate;
  }
});
