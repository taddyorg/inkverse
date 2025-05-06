import axios, { type AxiosRequestConfig } from "axios";

type SlackWebhookChannel = 'signup' | 'general';

const SLACK_WEBHOOKS = JSON.parse(process.env.SLACK_WEBHOOKS || '{}');

export async function sendSlackNotification(channel: SlackWebhookChannel, payload: any) {
  if (process.env.NODE_ENV !== "production") {
    console.log('LocalHost Sending slack notification: ', payload);
    return;
  }

  const webhookUrl = SLACK_WEBHOOKS[channel];
  if (!webhookUrl) {
    console.log('Invalid webhook type:', channel);
    return;
  }

  const options: AxiosRequestConfig = {
    method: 'POST',
    url: webhookUrl,
    timeout: 1000 * 5,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'inkverse-api',
    },
    data: payload
  };

  await axios(options);
}