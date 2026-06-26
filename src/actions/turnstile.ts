"use server";

export async function verifyTurnstileToken(token: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY is not defined");
    return { success: false, error: "Server configuration error" };
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });

    const data = await res.json();
    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: "Turnstile verification failed" };
    }
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "An error occurred during verification" };
  }
}
