import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

const FROM = `EduPal <${process.env.GMAIL_USER}>`

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#111827;padding:28px 36px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">EduPal</h1>
      <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Learn. Support. Thrive.</p>
    </div>
    <div style="padding:36px;">
      ${content}
    </div>
    <div style="padding:20px 36px;border-top:1px solid #f0f0f0;background:#fafafa;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        This email was sent by EduPal. If you did not request this, please ignore it.
      </p>
    </div>
  </div>
</body>
</html>`.trim()
}

export async function sendWelcomeEmail(
  to: string,
  data: { firstName: string; appUrl: string }
): Promise<void> {
  const { firstName, appUrl } = data
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:600;">
      Welcome to EduPal, ${firstName}!
    </h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
      Your account request has been received and is <strong style="color:#d97706;">pending administrator approval</strong>.
      You will receive an email with a link to set up your account once approved.
    </p>
    <a href="${appUrl}/login" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Go to EduPal
    </a>
  `)

  await getTransporter().sendMail({ from: FROM, to, subject: 'Welcome to EduPal — Request Received', html })
}

export async function sendSetupEmail(
  to: string,
  data: { firstName: string; setupUrl: string }
): Promise<void> {
  const { firstName, setupUrl } = data
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:600;">
      Your account has been approved!
    </h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
      Hi ${firstName}, your EduPal account has been <strong style="color:#059669;">approved</strong>.
      Click the button below to set your password and get started. This link expires in 48 hours.
    </p>
    <a href="${setupUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Set up my account
    </a>
    <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;">
      Or copy this link: ${setupUrl}
    </p>
  `)

  await getTransporter().sendMail({ from: FROM, to, subject: 'EduPal — Set Up Your Account', html })
}
