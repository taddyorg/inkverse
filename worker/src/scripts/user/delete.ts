import { User } from '@inkverse/shared-server/models/user';

async function run() {
  const inputs = process.argv.slice(2);
  const userId = inputs[0];

  if (!userId) {
    console.error('Error: User ID is required');
    console.log('Usage: yarn worker:user:delete <userId>');
    process.exit(1);
  }

  console.log(`Attempting to delete user with ID: ${userId}`);

  try {
    // First, check if user exists
    const user = await User.getUserById(userId);
    
    if (!user) {
      console.error(`Error: User with ID ${userId} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (username: ${user.username || 'N/A'})`);
    console.log('Deleting user and all associated data...');

    // Delete the user and all related data
    const success = await User.deleteUser(userId);

    if (success) {
      console.log('Successfully deleted user and all associated data:');
      console.log('- User record');
      console.log('- User devices');
      console.log('- OAuth tokens');
      console.log('- Comic series subscriptions');
      console.log('- Removed from email lists');
    } else {
      console.error('Failed to delete user');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    process.exit(1);
  }

  // End node program
  process.exit(0);
}

run();