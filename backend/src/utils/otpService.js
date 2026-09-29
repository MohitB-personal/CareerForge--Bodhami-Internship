const crypto = require('crypto');

const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const getKey = (email, role, purpose = 'verification') => {
    return `${purpose}:${role}:${(email || '').toLowerCase()}`;
};

const saveOTP = (email, otp, data = {}) => {
    const { role, purpose = 'verification' } = data;

    otpStore.set(getKey(email, role, purpose), {
        otp,
        ...data,
        purpose,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
    });
};

const getOTP = (email, role, purpose = 'verification') => {
    const key = getKey(email, role, purpose);
    const record = otpStore.get(key);

    if (!record) {
        return null;
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(key);
        return null;
    }

    return record;
};

const deleteOTP = (email, role, purpose = 'verification') => {
    otpStore.delete(getKey(email, role, purpose));
};

module.exports = {
    generateOTP,
    saveOTP,
    getOTP,
    deleteOTP,
};