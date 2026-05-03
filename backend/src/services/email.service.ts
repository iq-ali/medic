import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f8f9fa;
  margin: 0;
  padding: 0;
`

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${baseStyle}">
  <div style="max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #111827; padding: 28px 36px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">EduPal</h1>
      <p style="margin: 4px 0 0; color: #9ca3af; font-size: 13px;">Learn. Support. Thrive.</p>
    </div>
    <div style="padding: 36px;">
      ${content}
    </div>
    <div style="padding: 20px 36px; border-top: 1px solid #f0f0f0; background: #fafafa;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        This email was sent by EduPal. If you did not request this, please ignore it.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendWelcomeEmail(
  to: string,
  data: { firstName: string; orgEmail: string; defaultPassword: string; appUrl: string }
): Promise<void> {
  const { firstName, orgEmail, defaultPassword, appUrl } = data
  const content = `
    <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 600;">
      Welcome to EduPal, ${firstName}!
    </h2>
    <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">
      Your account has been created and is <strong style="color: #d97706;">pending administrator approval</strong>.
      You will receive another email once your account has been approved and you can sign in.
    </p>

    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your login credentials</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 110px;">Login Email</td>
          <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 500;">${orgEmail}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Password</td>
          <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 500; font-family: monospace;">${defaultPassword}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Please keep these credentials safe. You will be asked to change your password on first login.
    </p>

    <a href="${appUrl}/login" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
      Go to EduPal
    </a>
  `
  const transporter = createTransport()
  await transporter.sendMail({
    from: `"EduPal" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to EduPal — Account Pending Approval',
    html: emailWrapper(content),
  })
}

export async function sendApprovalEmail(
  to: string,
  data: { firstName: string; orgEmail: string; appUrl: string }
): Promise<void> {
  const { firstName, orgEmail, appUrl } = data
  const content = `
    <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 600;">
      Your account has been approved!
    </h2>
    <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">
      Hi ${firstName}, great news! Your EduPal account has been reviewed and
      <strong style="color: #059669;">approved</strong>. You can now sign in and start using the platform.
    </p>

    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your login email</p>
      <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 500;">${orgEmail}</p>
    </div>

    <a href="${appUrl}/login" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
      Sign in to EduPal
    </a>
  `
  const transporter = createTransport()
  await transporter.sendMail({
    from: `"EduPal" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'EduPal — Your Account Has Been Approved',
    html: emailWrapper(content),
  })
}
