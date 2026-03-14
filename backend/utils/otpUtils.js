/**
 * OTP Utility Functions
 * Generates, validates, and manages OTP lifecycle.
 */

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiry(minutes = 5) {
    return new Date(Date.now() + minutes * 60 * 1000);
}

function isOtpExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
}

export { generateOTP, getOtpExpiry, isOtpExpired };
