import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Gửi email sử dụng SMTP cấu hình từ file .env.
 * Nếu không cấu hình SMTP_HOST hoặc SMTP_USER, service sẽ chạy ở chế độ MOCK (in ra console).
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "no-reply@crm.local";

  if (!host || !user || !pass) {
    console.log("=== [EMAIL MOCK MODE] ===");
    console.log(`To:      ${to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log("=========================");
    return { success: true, messageId: `mock-email-id-${Date.now()}` };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true cho port 465, false cho các port khác như 587
      auth: {
        user,
        pass
      }
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Lỗi khi gửi email qua SMTP:", error);
    return { success: false, error: error?.message || String(error) };
  }
}
