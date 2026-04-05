import * as functions from 'firebase-functions';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = functions.config().sendgrid?.from_email || process.env.SENDGRID_FROM_EMAIL || 'noreply@eventhub.app';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  functions.logger.warn('SendGrid API key not configured');
}

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  if (!SENDGRID_API_KEY) {
    functions.logger.warn('SendGrid not configured, skipping email send');
    return;
  }

  const { to, subject, html, attachments } = params;

  functions.logger.info('Sending email', { to, subject });

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject,
      html,
      attachments,
    });
    functions.logger.info('Email sent successfully', { to, subject });
  } catch (error) {
    functions.logger.error('Error sending email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EventHub! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for joining EventHub, your one-stop destination for discovering and booking amazing events.</p>
            <p>With EventHub, you can:</p>
            <ul>
              <li>Discover events near you</li>
              <li>Book tickets instantly</li>
              <li>Get digital tickets with QR codes</li>
              <li>Receive event reminders</li>
            </ul>
            <a href="#" class="button">Explore Events</a>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to EventHub! 🎉',
    html,
  });
}

export async function sendBookingConfirmationEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventVenue: string,
  ticketType: string,
  quantity: number,
  pdfBuffer?: Buffer
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-card { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .ticket-type { color: #667eea; font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed! 🎟️</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your booking has been confirmed! Here are your ticket details:</p>
            <div class="ticket-card">
              <h3>${eventTitle}</h3>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Venue:</strong> ${eventVenue}</p>
              <p><strong>Ticket Type:</strong> <span class="ticket-type">${ticketType}</span></p>
              <p><strong>Quantity:</strong> ${quantity}</p>
            </div>
            <p>Your ticket PDF is attached to this email. Please show the QR code at the event entrance.</p>
            <p>See you there! 🎉</p>
          </div>
          <div class="footer">
            <p>EventHub - Your Event Destination</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const attachments = pdfBuffer ? [
    {
      content: pdfBuffer.toString('base64'),
      filename: 'ticket.pdf',
      type: 'application/pdf',
      disposition: 'attachment',
    },
  ] : undefined;

  await sendEmail({
    to: email,
    subject: `Booking Confirmed: ${eventTitle}`,
    html,
    attachments,
  });
}

export async function sendBookingCancellationEmail(
  email: string,
  name: string,
  eventTitle: string,
  reason: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your booking for <strong>${eventTitle}</strong> has been cancelled.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Booking Cancelled: ${eventTitle}`,
    html,
  });
}

export async function sendEventReminderEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventVenue: string,
  hoursUntil: number
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder { font-size: 48px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Event Reminder</h1>
          </div>
          <div class="content">
            <div class="reminder">${hoursUntil === 1 ? '🚀' : '📅'}</div>
            <h2>Hello ${name},</h2>
            <p>Your event is starting in <strong>${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}</strong>!</p>
            <h3>${eventTitle}</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Venue:</strong> ${eventVenue}</p>
            <p>Don't forget to bring your ticket with the QR code for entry.</p>
            <p>See you soon! 🎉</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Reminder: ${eventTitle} starts in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}!`,
    html,
  });
}
