const crypto = require("crypto");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 60 * 1000;

function createPhoneOtp() {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return { code, hash, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
}

function hashPhoneOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function sendPhoneOtp(phone, code) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, NODE_ENV } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    if (NODE_ENV === "production") {
      throw new Error("Phone OTP delivery is not configured");
    }
    console.log(`[dev] OTP for ${phone}: ${code}`);
    return;
  }

  const body = new URLSearchParams({
    To: phone,
    From: TWILIO_PHONE_NUMBER,
    Body: `Your FlatFinder verification code is ${code}. It expires in 10 minutes.`,
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );
  if (!response.ok) throw new Error("Phone OTP could not be sent");
}

module.exports = { OTP_RESEND_DELAY_MS, createPhoneOtp, hashPhoneOtp, sendPhoneOtp };
