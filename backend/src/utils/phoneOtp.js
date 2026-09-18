async function verifyMsg91AccessToken(accessToken) {
  const authkey = process.env.MSG91_AUTH_KEY;
  if (!authkey) throw new Error("MSG91 OTP verification is not configured");

  const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ authkey, "access-token": accessToken }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.type === "error" || result.message === "error") {
    throw new Error(result.message || "MSG91 could not verify the phone number");
  }
  return result;
}

module.exports = { verifyMsg91AccessToken };
