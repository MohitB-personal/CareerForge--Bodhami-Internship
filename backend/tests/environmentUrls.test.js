const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildOAuthFailureRedirect,
  buildFrontendDestination,
  buildEmailVerificationUrl,
  getFrontendUrl: getAuthFrontendUrl,
} = require('../src/controllers/authController');
const {
  buildEmailVerificationUrl: buildEmailServiceVerificationUrl,
  getFrontendUrl: getEmailFrontendUrl,
} = require('../src/utils/emailService');
const {
  buildCompanyVerificationUrl,
  getFrontendUrl: getCompanyFrontendUrl,
  getBackendUrl: getCompanyBackendUrl,
} = require('../src/controllers/companyController');
const {
  getFrontendUrl,
  getBackendUrl,
  LOCAL_FRONTEND_URL,
  PROD_FRONTEND_URL,
  LOCAL_BACKEND_URL,
} = require('../src/utils/urlHelper');

const LOCAL_FRONTEND = LOCAL_FRONTEND_URL;
const PROD_FRONTEND = PROD_FRONTEND_URL;

test('Frontend URL defaults to localhost:5173 in local development', () => {
  delete process.env.NODE_ENV;
  delete process.env.APP_ENV;
  delete process.env.CLIENT_URL;
  delete process.env.FRONTEND_URL;

  assert.equal(getFrontendUrl(), LOCAL_FRONTEND);
  assert.equal(getAuthFrontendUrl(), LOCAL_FRONTEND);
  assert.equal(getEmailFrontendUrl(), LOCAL_FRONTEND);
  assert.equal(getCompanyFrontendUrl(), LOCAL_FRONTEND);
});

test('Google OAuth URLs use localhost in local development', () => {
  delete process.env.NODE_ENV;
  process.env.CLIENT_URL = LOCAL_FRONTEND;
  process.env.FRONTEND_URL = LOCAL_FRONTEND;

  assert.equal(buildFrontendDestination('/dashboard'), `${LOCAL_FRONTEND}/dashboard`);
  const failureRedirect = new URL(buildOAuthFailureRedirect('/login', 'Failed'));
  assert.equal(failureRedirect.origin, LOCAL_FRONTEND);
  assert.equal(failureRedirect.pathname, '/login');
  assert.equal(failureRedirect.searchParams.get('oauth_error'), 'Failed');
});

test('Email verification links use localhost in local development', () => {
  delete process.env.NODE_ENV;
  process.env.CLIENT_URL = LOCAL_FRONTEND;
  process.env.FRONTEND_URL = LOCAL_FRONTEND;

  const candidateUrl = buildEmailVerificationUrl('candidate@example.com', 'candidate');
  assert.equal(candidateUrl, `${LOCAL_FRONTEND}/verify-email?email=candidate%40example.com&role=candidate`);

  const emailServiceUrl = buildEmailServiceVerificationUrl('user@example.com', 'candidate');
  assert.equal(emailServiceUrl, `${LOCAL_FRONTEND}/verify-email?email=user%40example.com&role=candidate`);
});

test('Company verification links use localhost in local development', () => {
  delete process.env.NODE_ENV;
  process.env.CLIENT_URL = LOCAL_FRONTEND;
  process.env.FRONTEND_URL = LOCAL_FRONTEND;

  assert.equal(buildCompanyVerificationUrl('/company/profile'), `${LOCAL_FRONTEND}/company/profile`);
  assert.equal(
    buildCompanyVerificationUrl('company@example.com'),
    `${LOCAL_FRONTEND}/verify-email?email=company%40example.com&role=company`
  );
});

test('When CLIENT_URL is set to production S3 URL, Google OAuth URLs use production S3', () => {
  delete process.env.NODE_ENV;
  process.env.CLIENT_URL = PROD_FRONTEND;

  assert.equal(buildFrontendDestination('/dashboard'), `${PROD_FRONTEND}/dashboard`);
  const failureRedirect = new URL(buildOAuthFailureRedirect('/login', 'Failed'));
  assert.equal(failureRedirect.origin, PROD_FRONTEND);
  assert.equal(failureRedirect.pathname, '/login');
});

test('When CLIENT_URL is set to production S3 URL, email verification links use production S3', () => {
  delete process.env.NODE_ENV;
  process.env.CLIENT_URL = PROD_FRONTEND;

  const candidateUrl = buildEmailVerificationUrl('candidate@example.com', 'candidate');
  assert.equal(candidateUrl, `${PROD_FRONTEND}/verify-email?email=candidate%40example.com&role=candidate`);

  const emailServiceUrl = buildEmailServiceVerificationUrl('user@example.com', 'company');
  assert.equal(emailServiceUrl, `${PROD_FRONTEND}/verify-email?email=user%40example.com&role=company`);
});

test('When CLIENT_URL is set to production S3 URL, company verification links use production S3', () => {
  delete process.env.NODE_ENV;
  process.env.CLIENT_URL = PROD_FRONTEND;

  assert.equal(buildCompanyVerificationUrl('/company/profile'), `${PROD_FRONTEND}/company/profile`);
  assert.equal(
    buildCompanyVerificationUrl('employer@example.com'),
    `${PROD_FRONTEND}/verify-email?email=employer%40example.com&role=company`
  );
});

test('When NODE_ENV=production, frontend URLs default to S3 even if CLIENT_URL is unset or localhost', () => {
  process.env.NODE_ENV = 'production';
  delete process.env.CLIENT_URL;
  delete process.env.FRONTEND_URL;

  assert.equal(getFrontendUrl(), PROD_FRONTEND);
  assert.equal(getAuthFrontendUrl(), PROD_FRONTEND);
  assert.equal(getEmailFrontendUrl(), PROD_FRONTEND);
  assert.equal(getCompanyFrontendUrl(), PROD_FRONTEND);

  // Even if CLIENT_URL was left as localhost in production .env:
  process.env.CLIENT_URL = LOCAL_FRONTEND;
  assert.equal(getFrontendUrl(), PROD_FRONTEND);
  assert.equal(buildFrontendDestination('/dashboard'), `${PROD_FRONTEND}/dashboard`);
  const failureRedirect = new URL(buildOAuthFailureRedirect('/login', 'Failed'));
  assert.equal(failureRedirect.origin, PROD_FRONTEND);

  const candidateUrl = buildEmailVerificationUrl('candidate@example.com', 'candidate');
  assert.equal(candidateUrl, `${PROD_FRONTEND}/verify-email?email=candidate%40example.com&role=candidate`);

  const companyUrl = buildCompanyVerificationUrl('/company/profile');
  assert.equal(companyUrl, `${PROD_FRONTEND}/company/profile`);

  delete process.env.NODE_ENV;
  delete process.env.CLIENT_URL;
});

test('Backend URL resolves to localhost:5000 in local dev, and respects BACKEND_URL in production', () => {
  delete process.env.NODE_ENV;
  delete process.env.BACKEND_URL;

  assert.equal(getBackendUrl(), LOCAL_BACKEND_URL);
  assert.equal(getCompanyBackendUrl(), LOCAL_BACKEND_URL);

  // Production with explicit BACKEND_URL (e.g. EC2 IP)
  process.env.NODE_ENV = 'production';
  process.env.BACKEND_URL = 'http://13.238.22.215';
  assert.equal(getBackendUrl(), 'http://13.238.22.215');
  assert.equal(getCompanyBackendUrl(), 'http://13.238.22.215');

  // Production dynamic request host fallback when BACKEND_URL is localhost or unset
  process.env.BACKEND_URL = 'http://localhost:5000';
  const mockReq = {
    protocol: 'http',
    get: (header) => (header === 'host' ? '13.238.22.215:5000' : null),
  };
  assert.equal(getBackendUrl(mockReq), 'http://13.238.22.215:5000');

  delete process.env.NODE_ENV;
  delete process.env.BACKEND_URL;
});
