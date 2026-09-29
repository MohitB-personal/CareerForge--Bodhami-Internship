const axios = require('axios');

/**
 * Verify Indian Pincode using India Post Pincode API
 * @param {string} pincode - 6 digit Indian Pincode
 * @returns {object} Pincode verification and location details
 */
const verifyPincode = async (pincode) => {
    const normalizedPincode = String(pincode).trim();

    if (!/^\d{6}$/.test(normalizedPincode)) {
        return {
            valid: false,
            pincode: normalizedPincode,
            message: 'Pincode must be exactly 6 digits.',
        };
    }

    const response = await axios.get(
        `https://api.postalpincode.in/pincode/${normalizedPincode}`
    );

    const result = response.data?.[0];

    if (!result || result.Status !== 'Success' || !result.PostOffice?.length) {
        return {
            valid: false,
            pincode: normalizedPincode,
            message: 'Invalid Pincode.',
        };
    }

    const postOffice = result.PostOffice[0];

    return {
        valid: true,
        pincode: normalizedPincode,
        postOffice: postOffice.Name,
        district: postOffice.District,
        state: postOffice.State,
        region: postOffice.Region,
    };
};

module.exports = {
    verifyPincode,
};