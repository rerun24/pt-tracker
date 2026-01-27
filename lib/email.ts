import { Resend } from 'resend';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendReminderEmail(
  to: string,
  exercises: Exercise[]
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.error('Resend API key not configured');
    return false;
  }

  const exerciseList = exercises
    .map((e) => `- ${e.name}: ${e.sets} sets x ${e.reps} reps`)
    .join('\n');

  const htmlList = exercises
    .map((e) => `<li><strong>${e.name}</strong>: ${e.sets} sets x ${e.reps} reps</li>`)
    .join('');

  try {
    const { error } = await resend.emails.send({
      from: 'PT Tracker <onboarding@resend.dev>',
      to: [to],
      subject: 'Daily Physical Therapy Reminder',
      text: `Hi! Don't forget to complete your physical therapy exercises today:\n\n${exerciseList}\n\nStay consistent for the best results!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Daily PT Reminder</h2>
          <p>Hi! Don't forget to complete your physical therapy exercises today:</p>
          <ul style="line-height: 1.8;">${htmlList}</ul>
          <p style="margin-top: 20px;">Stay consistent for the best results!</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #6b7280;">
            Sent from PT Tracker
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}
