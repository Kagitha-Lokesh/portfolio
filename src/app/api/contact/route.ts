import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/agent/rate-limit";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. Rate limiting: 3 per hour per IP
    const ipRate = await rateLimit({
      key: `contact:${clientIp}`,
      limit: 3,
      windowSeconds: 3600,
    });

    if (!ipRate.success) {
      return NextResponse.json(
        {
          error: "You have sent the maximum allowed messages for this hour. Please email Lokesh directly at kagithalokesh8@gmail.com.",
          code: "IP_RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    // Global daily cap: 50 messages per day across all visitors
    const today = new Date().toISOString().slice(0, 10);
    const globalRate = await rateLimit({
      key: `contact:global:daily:${today}`,
      limit: 50,
      windowSeconds: 86400,
    });

    if (!globalRate.success) {
      return NextResponse.json(
        {
          error: "Daily message quota reached. Please email Lokesh directly at kagithalokesh8@gmail.com.",
          code: "GLOBAL_RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    // 2. Parse request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const { name, email, message, website, recentChat } = body as {
      name?: unknown;
      email?: unknown;
      message?: unknown;
      website?: unknown;
      recentChat?: unknown;
    };

    // 3. Honeypot check: "website" field must be empty
    if (typeof website === "string" && website.trim().length > 0) {
      // Silently return success to mislead bots without actually sending email
      return NextResponse.json({ success: true });
    }

    // 4. Validate name: required, <= 80 chars, sanitize CR/LF
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Please enter your name.", code: "INVALID_NAME" },
        { status: 400 }
      );
    }

    // Strip CR/LF to prevent email header injection
    const cleanName = name.replace(/[\r\n\t]/g, " ").trim().slice(0, 80);
    if (cleanName.length === 0) {
      return NextResponse.json(
        { error: "Please enter a valid name.", code: "INVALID_NAME" },
        { status: 400 }
      );
    }

    // 5. Validate email: required, regex format, <= 100 chars, sanitize CR/LF
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Please enter your email address.", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    const cleanEmail = email.replace(/[\r\n\t]/g, "").trim().slice(0, 100);
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address.", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    // 6. Validate message: required, 10 - 1000 chars
    if (typeof message !== "string") {
      return NextResponse.json(
        { error: "Please provide a message.", code: "INVALID_MESSAGE" },
        { status: 400 }
      );
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters long.", code: "MESSAGE_TOO_SHORT" },
        { status: 400 }
      );
    }

    if (cleanMessage.length > 1000) {
      return NextResponse.json(
        { error: "Message exceeds the 1000 character limit.", code: "MESSAGE_TOO_LONG" },
        { status: 400 }
      );
    }

    // Format chat context if supplied
    let chatContextText = "";
    let chatContextHtml = "";
    if (Array.isArray(recentChat) && recentChat.length > 0) {
      const validTurns: ChatTurn[] = [];
      for (const turn of recentChat.slice(-6)) {
        if (
          turn &&
          typeof turn === "object" &&
          (turn.role === "user" || turn.role === "assistant") &&
          typeof turn.content === "string"
        ) {
          validTurns.push({
            role: turn.role,
            content: turn.content.replace(/\[\[CONTACT_DRAFT\]\].*$/, "").trim(),
          });
        }
      }

      if (validTurns.length > 0) {
        chatContextText = "\n\n--- Recent Conversation Context ---\n" +
          validTurns
            .map((t) => `${t.role === "user" ? "Visitor" : "AI Assistant"}: ${t.content}`)
            .join("\n\n");

        chatContextHtml = `
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
            <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #777;">Recent Conversation Context</h4>
            ${validTurns
              .map(
                (t) => `
                <div style="margin-bottom: 12px; font-size: 14px;">
                  <strong style="color: ${t.role === "user" ? "#0d0d0d" : "#555"};">${t.role === "user" ? "Visitor" : "AI"}:</strong>
                  <p style="margin: 4px 0 0; color: #333; white-space: pre-wrap;">${escapeHtml(t.content)}</p>
                </div>`
              )
              .join("")}
          </div>
        `;
      }
    }

    let toEmail = process.env.CONTACT_TO_EMAIL?.trim();
    let fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();
    let resendApiKey = process.env.RESEND_API_KEY?.trim();

    if (!resendApiKey) {
      try {
        const envPath = path.join(process.cwd(), ".env.local");
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, "utf8");
          for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
              const idx = trimmed.indexOf("=");
              if (idx !== -1) {
                const k = trimmed.slice(0, idx).trim();
                const v = trimmed.slice(idx + 1).trim();
                if (k === "RESEND_API_KEY" && !resendApiKey) resendApiKey = v;
                if (k === "CONTACT_TO_EMAIL" && !toEmail) toEmail = v;
                if (k === "CONTACT_FROM_EMAIL" && !fromEmail) fromEmail = v;
              }
            }
          }
        }
      } catch {}
    }

    toEmail = toEmail || "kagithalokesh8@gmail.com";
    fromEmail = fromEmail || "Portfolio Contact <onboarding@resend.dev>";

    if (!resendApiKey) {
      console.warn("[Contact API] RESEND_API_KEY is not set.");
      return NextResponse.json(
        {
          error: "Email delivery service is currently not configured. Please email Lokesh directly at kagithalokesh8@gmail.com.",
          code: "SERVICE_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    const emailSubject = `Portfolio message from ${cleanName}`;
    const textBody = `Name: ${cleanName}\nEmail: ${cleanEmail}\n\nMessage:\n${cleanMessage}${chatContextText}`;
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #0d0d0d; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; border-bottom: 2px solid #0d0d0d; padding-bottom: 8px;">
          New message from Portfolio
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; width: 80px; color: #777;">From:</td>
            <td style="padding: 6px 0; font-weight: 500;">${escapeHtml(cleanName)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #777;">Email:</td>
            <td style="padding: 6px 0;"><a href="mailto:${escapeHtml(cleanEmail)}" style="color: #0d0d0d; text-decoration: underline;">${escapeHtml(cleanEmail)}</a></td>
          </tr>
        </table>
        <div style="background-color: #f4f2ee; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #777; margin: 0 0 8px;">Message</h3>
          <p style="margin: 0; white-space: pre-wrap; font-size: 15px; color: #0d0d0d;">${escapeHtml(cleanMessage)}</p>
        </div>
        ${chatContextHtml}
      </div>
    `;

    // 7. Dispatch via Resend REST API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: cleanEmail,
        subject: emailSubject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
      let resendErr = "Unknown Resend error";
      try {
        const errJson = await resendResponse.json();
        resendErr = JSON.stringify(errJson);
      } catch {
        resendErr = `Status ${resendResponse.status}`;
      }
      console.error("[Contact API] Resend API call failed:", resendErr);

      return NextResponse.json(
        {
          error: "Failed to dispatch email. Please email Lokesh directly at kagithalokesh8@gmail.com.",
          code: "DELIVERY_FAILED",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[Contact API Internal Error]:", (err as Error)?.message);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again or email Lokesh directly at kagithalokesh8@gmail.com.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
