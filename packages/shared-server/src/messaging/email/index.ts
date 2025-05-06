import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import { emailCient } from "./setup.js";

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