import { User } from '@inkverse/shared-server/models/user';
import { OAuthToken } from '@inkverse/shared-server/models/oauth_token';
import { TADDY_HOSTING_PROVIDER_UUID } from '@inkverse/public/hosting-providers';

async function run() {
  const inputs = process.argv.slice(2);
  const userId = inputs[0];

  if (!userId) {
    console.error('Error: User ID is required');
    console.log('Usage: yarn disconnect-hosting-provider <userId>');
    process.exit(1);
  }

  console.log(`Attempting to disconnect hosting provider for user ID: ${userId}`);

  try {
    // First, check if user exists
    const user = await User.getUserById(userId);

    if (!user) {
      console.error(`Error: User with ID ${userId} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (username: ${user.username || 'N/A'})`);
    console.log('Removing hosting provider OAuth tokens...');

    await OAuthToken.deleteRefreshTokensForUserAndHostingProvider(userId, TADDY_HOSTING_PROVIDER_UUID);

    console.log('Successfully disconnected hosting provider (Patreon) for user.');
  } catch (error) {
    console.error('Error disconnecting hosting provider:', error);
    process.exit(1);
  }

  // End node program
  process.exit(0);
}

run();
