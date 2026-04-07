import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import { emailCient } from "./setup.js";
import { User } from '../../models/index.js';
import { NotificationEventType } from '../../graphql/types.js';
import type { NotificationData } from '../notifications/index.js';
import { type DigestTotals, getDigestText } from '../notifications/digest.js';
import { arrayToObject, getInkverseUrl } from '@inkverse/public/utils';

enum EMAIL_AUDIENCE {
  GENERAL = 'General',
};

function defaultFrom(audience: EMAIL_AUDIENCE){
  return `info@inkverse.co (Inkverse Webtoons)`;
}

type SendEmailParams = {
  subject: string;
  html: string;
  toAddress: string;
  audience?: EMAIL_AUDIENCE;
  fromAddress?: string;
}

export async function sendEmail({ subject, html, toAddress, audience = EMAIL_AUDIENCE.GENERAL, fromAddress = defaultFrom(audience) }: SendEmailParams) {

  if (process.env.NODE_ENV !== "production") {
    console.log('LocalHost Sending email ', { subject, html, toAddress, audience, fromAddress });
    return;
  }
  try {
    const params = {
      "Content": { 
       "Simple": { 
          "Body": { 
             "Html": { 
                "Charset": "UTF-8",
                "Data": html
             },
          },
          "Subject": { 
             "Charset": "UTF-8",
             "Data": subject
          }
       },
    },
    "Destination": { 
       "ToAddresses": [ toAddress ]
    },
    "FromEmailAddress": fromAddress,
    "ReplyToAddresses": [ fromAddress ],
 };

    const command = new SendEmailCommand(params);
    await emailCient.send(command);
  } catch (error) {
    console.error('Error sending email', error);
  }
}

function notificationEmailWrapper(heading: string, body: string, ctaUrl: string, ctaLabel: string, bannerImageUrl?: string): string {
  return `
    <div style="background-color: #FFE9E4; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        ${bannerImageUrl ? `<img src="${bannerImageUrl}" alt="" width="560" style="max-width: 100%; height: auto; display: block; border: 0;" />` : ''}
        <div style="padding: 36px 32px 32px;">
          <h1 style="font-size: 22px; font-weight: 700; color: #403B51; margin: 0 0 12px;">${heading}</h1>
          <p style="font-size: 15px; color: #6B6580; margin: 0 0 28px; line-height: 1.5;">${body}</p>
          <div style="text-align: center;">
            <a href="${ctaUrl}" style="display: inline-block; padding: 14px 32px; background-color: #ED5959; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600;">${ctaLabel}</a>
          </div>
          ${emailFooter()}
        </div>
      </div>
    </div>
  `;
}

export function buildNotificationEmailContent(
  eventType: NotificationEventType,
  data: NotificationData
): { subject: string; html: string } | null {
  const actorName = data.actor?.name || data.actor?.username || 'Someone';
  const seriesName = data.comicSeries?.name || 'a comic';

  switch (eventType) {
    case NotificationEventType.NEW_EPISODE_RELEASED:
      return {
        subject: `New episode of ${seriesName} is now available`,
        html: notificationEmailWrapper(
          `New Episode Available`,
          `A new episode of <strong style="color: #403B51;">${seriesName}</strong> is now available on Inkverse.`,
          `https://inkverse.co${getInkverseUrl({ type: 'comicissue', shortUrl: data.comicSeries?.shortUrl, name: data.comicIssue?.name, uuid: data.comicIssue?.uuid })}`,
          'Read New Episode',
          data.imageUrl,
        ),
      };
    case NotificationEventType.COMMENT_REPLY:
      return {
        subject: `Yay! Someone replied to your comment`,
        html: notificationEmailWrapper(
          `${actorName} replied to your comment`,
          `${actorName} replied to your comment ${data.comicIssue?.name ? ` on <strong style="color: #403B51;">${data.comicIssue.name}</strong>` : '' } from <strong style="color: #403B51;">${seriesName}</strong>.`,
          `https://inkverse.co${getInkverseUrl({ type: 'notification-screen' })}`,
          'View on Inkverse',
          data.imageUrl,
        ),
      };
    case NotificationEventType.COMMENT_LIKED:
      return {
        subject: `Yay! Someone liked your comment`,
        html: notificationEmailWrapper(
          `${actorName} liked your comment`,
          `${actorName} liked your comment ${data.comicIssue?.name ? ` on <strong style="color: #403B51;">${data.comicIssue.name}</strong>` : '' } from <strong style="color: #403B51;">${seriesName}</strong>.`,
          `https://inkverse.co${getInkverseUrl({ type: 'notification-screen' })}`,
          'View on Inkverse',
          data.imageUrl,
        ),
      };
    case NotificationEventType.CREATOR_EPISODE_LIKED:
    case NotificationEventType.CREATOR_EPISODE_COMMENTED:
      console.error(`buildNotificationEmailContent called with aggregated event type: ${eventType}. These should be handled by the digest job.`);
      return null;
    default:
      return null;
  }
}

export async function sendDigestEmail(
  userId: number,
  totals: DigestTotals
): Promise<void> {
  try {
    const user = await User.getUserById(userId);
    if (!user?.email) return;

    const { title } = getDigestText(totals);
    const subject = title;
    const displayName = user.name || user.username || 'there';

    const likesBlock = totals.episodeLikes > 0 ? `
      <td style="width: 50%; padding: 8px;">
        <div style="background-color: #FFE9E4; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: #ED5959; line-height: 1;">${totals.episodeLikes}</div>
          <div style="font-size: 13px; color: #403B51; margin-top: 6px;">${totals.episodeLikes === 1 ? 'Episode Like' : 'Episode Likes'}</div>
        </div>
      </td>` : '';

    const commentsBlock = totals.episodeComments > 0 ? `
      <td style="width: 50%; padding: 8px;">
        <div style="background-color: #F3EAFF; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: #A372F2; line-height: 1;">${totals.episodeComments}</div>
          <div style="font-size: 13px; color: #403B51; margin-top: 6px;">${totals.episodeComments === 1 ? 'Comment' : 'Comments'}</div>
        </div>
      </td>` : '';

    const html = `
      <div style="background-color: #FFE9E4; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <img src="https://ink0.inkverse.co/general/creator-digest.png" alt="Inkverse daily digest" width="560" style="max-width: 100%; height: auto; display: block; border: 0;" />
          <div style="padding: 28px 32px 32px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #403B51; margin: 0 0 6px;">Hi ${displayName}!</h1>
            <p style="font-size: 15px; color: #6B6580; margin: 0 0 24px;">Your fans showed you some love today.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              <tr>${likesBlock}${commentsBlock}</tr>
            </table>
            <div style="text-align: center; margin-top: 28px;">
              <a href="https://inkverse.co${getInkverseUrl({ type: 'notification-screen' })}" style="display: inline-block; padding: 14px 32px; background-color: #ED5959; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600;">View Details</a>
            </div>
            ${emailFooter()}
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      subject,
      html,
      toAddress: user.email,
    });
  } catch (error) {
    console.error(error as Error, `Error sending digest email to user ${userId}`, error);
  }
}

function emailFooter(): string {
  return `
    <hr style="margin-top: 32px; border: none; border-top: 1px solid #F0E0DB;" />
    <p style="font-size: 12px; color: #9B8FA8; margin-top: 16px;">
      <a href="https://inkverse.co/profile/settings/notifications" style="color: #9B8FA8;">Unsubscribe</a>
    </p>`;
}

export async function sendNotificationEmail(
  email: string,
  content: { subject: string; html: string }
): Promise<void> {
  try {
    await sendEmail({
      subject: content.subject,
      html: content.html,
      toAddress: email,
    });
  } catch (error) {
    console.error(error as Error, `Error sending notification email to ${email}`, error);
  }
}

export async function sendBatchNotificationEmail(
  userIds: number[],
  content: { subject: string; html: string }
): Promise<void> {
  const batchSize = 25;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const users = await User.getEmailsForUserIds(batch);
    const usersByIdMap = arrayToObject(users, "id");

    await Promise.allSettled(
      batch
        .filter(id => usersByIdMap[id])
        .map(id => sendNotificationEmail(usersByIdMap[id]!.email, content))
    );
  }
}
