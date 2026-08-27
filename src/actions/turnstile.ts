"use server";

export async function verifyTurnstileToken(token: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY is not defined");
    return { success: false, error: "Server configuration error" };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey.trim());
    formData.append("response", token);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      return { success: true };
    } else {
      console.error("Turnstile siteverify failed:", data);
      const errorDetail = data["error-codes"] ? data["error-codes"].join(", ") : "";
      return { success: false, error: `Turnstile verification failed ${errorDetail}` };
    }
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "An error occurred during verification" };
  }
}
