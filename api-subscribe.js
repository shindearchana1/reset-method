// api/subscribe.js
// Secure server-side route — Brevo API key never exposed to browser

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        listIds: [parseInt(process.env.BREVO_LIST_ID || "3")],
        updateEnabled: true,
        attributes: {
          SOURCE: "RESET Method App",
          SIGNUP_DATE: new Date().toISOString().split("T")[0],
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      // Already subscribed — treat as success
      if (err?.code === "duplicate_parameter") {
        return res.status(200).json({ ok: true, alreadySubscribed: true });
      }
      console.error("Brevo error:", err);
      return res.status(500).json({ error: "Subscription failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Request failed" });
  }
}
