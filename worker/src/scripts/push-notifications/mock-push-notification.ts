import { sendMessage, type INKVERSE_HIGH_PRIORITY_TYPE } from '@inkverse/shared-server/queues/utils';
import { type SendPushNotificationQueueMessage, type PushNotificationType } from '@inkverse/shared-server/messaging/push-notifications/index';

async function run() {
  const inputs = process.argv.slice(2);
  const dataString = inputs[0];

  if (!dataString) {
    console.error('Usage: npm run send-push-notification \'<JSON_OBJECT>\'');
    console.error('');
    console.error('Example:');
    console.error('npm run send-push-notification \'{"pushNotificationType": "NEW_EPISODE_RELEASED", "seriesUuid": "abc123", "issueUuid": "def456"}\'');
    console.error('');
    console.error('Available push types: NEW_EPISODE_RELEASED, APP_UPDATE');
    process.exit(1);
  }

  let pushNotificationData: Partial<SendPushNotificationQueueMessage>;
  
  try {
    pushNotificationData = JSON.parse(dataString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    console.error('Make sure your JSON is valid. Example:');
    console.error('\'{"pushNotificationType": "NEW_EPISODE_RELEASED", "seriesUuid": "abc123", "issueUuid": "def456"}\'');
    process.exit(1);
  }

  // Validate required fields
  if (!pushNotificationData.pushNotificationType) {
    console.error('Missing required field: pushNotificationType');
    process.exit(1);
  }

  // Validate push notification type
  const validPushTypes: PushNotificationType[] = ['NEW_EPISODE_RELEASED', 'APP_UPDATE'];
  if (!validPushTypes.includes(pushNotificationData.pushNotificationType)) {
    console.error(`Invalid push type: ${pushNotificationData.pushNotificationType}`);
    console.error('Available push types:', validPushTypes.join(', '));
    process.exit(1);
  }

  // Add the queue type
  const queueMessage = {
    type: 'SEND_PUSH_NOTIFICATION' as INKVERSE_HIGH_PRIORITY_TYPE,
    ...pushNotificationData,
  };
  
  await sendMessage('INKVERSE_HIGH_PRIORITY', queueMessage);

  // End node program
  process.exit(0);
}

run(); 