const test = require('node:test');
const assert = require('node:assert/strict');
const { buildOAuthFailureRedirect, buildFrontendDestination, sanitizeReturnTo } = require('../src/controllers/authController');

test('buildFrontendDestination keeps a valid frontend path', () => {
    process.env.FRONTEND_URL = 'http://localhost:5173';
    assert.equal(buildFrontendDestination('/dashboard'), 'http://localhost:5173/dashboard');
    assert.equal(buildFrontendDestination('/register/candidate'), 'http://localhost:5173/register/candidate');
});

test('sanitizeReturnTo blocks external redirect values', () => {
    assert.equal(sanitizeReturnTo('/dashboard'), '/dashboard');
    assert.equal(sanitizeReturnTo('https://evil.example/steal'), '/dashboard');
    assert.equal(sanitizeReturnTo('//evil.example'), '/dashboard');
});

test('buildOAuthFailureRedirect appends a readable error message', () => {
    process.env.FRONTEND_URL = 'http://localhost:5173';
    const target = new URL(buildOAuthFailureRedirect('/login', 'Google sign-in failed. Please try again.'));
    assert.equal(target.origin, 'http://localhost:5173');
    assert.equal(target.pathname, '/login');
    assert.equal(target.searchParams.get('oauth_error'), 'Google sign-in failed. Please try again.');
});
