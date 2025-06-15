
// GraphQL Type Definitions
export const NotificationPreferenceDefinitions = `
  """
  Types of notifications users can receive
  """
  enum NotificationType {
    NEW_EPISODE_RELEASED
  }

  """
  User's preference for a specific notification type
  """
  type NotificationPreference {
    id: ID!
    createdAt: Int
    updatedAt: Int
    userId: ID!
    notificationType: NotificationType!
    value: String
  }

  """
  Input for updating notification preferences
  """
  input NotificationPreferenceInput {
    notificationType: NotificationType!
  }
`;

