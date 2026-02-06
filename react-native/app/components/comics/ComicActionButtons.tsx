import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PressableOpacity, ThemedText, ThemedTextFontFamilyMap } from '@/app/components/ui';
import { SPACING } from '@/constants/Spacing';

interface AddToProfileButtonProps {
  isSubscribed: boolean;
  isLoading: boolean;
  onPress: () => void;
  selectedText: string;
  unselectedText: string;
}

interface NotificationButtonProps {
  isReceivingNotifications: boolean;
  isLoading: boolean;
  onPress: () => void;
}

export const AddToProfileButton = ({ 
  isSubscribed, 
  isLoading, 
  onPress,
  selectedText,
  unselectedText
}: AddToProfileButtonProps) => {
  const iconColor = 'black'; 
  const textColor = 'black'; 

  return (
    <View style={styles.buttonMargin}>
      <PressableOpacity
        onPress={onPress}
        disabled={isLoading}
        style={[styles.button, isLoading && styles.disabledButton]}
      >
        <View style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <MaterialIcons
              name={isSubscribed ? "bookmark" : "bookmark-outline"}
              size={22}
              color={iconColor}
            />
          )}
          <ThemedText style={[styles.buttonText, { color: textColor, fontFamily: ThemedTextFontFamilyMap.semiBold }]}>
            {isSubscribed ? selectedText : unselectedText}
          </ThemedText>
        </View>
      </PressableOpacity>
    </View>
  );
};

export const NotificationButton = ({
  isReceivingNotifications,
  isLoading,
  onPress,
}: NotificationButtonProps) => {
  const iconColor = 'black'; 

  return (
    <View style={styles.buttonMargin}>
      <PressableOpacity
        onPress={onPress}
        disabled={isLoading}
        style={[styles.button, isLoading && styles.disabledButton]}
      >
        <View style={styles.buttonContainer}>
          {isLoading
          ? <ActivityIndicator size="small" color={iconColor} />
          : <MaterialIcons
                name={isReceivingNotifications ? "notifications-active" : "notifications-none"}
                size={24}
                color={iconColor}
              />
          }
        </View>
      </PressableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonMargin: {
    marginRight: SPACING.sm,
  },
  button: {
    borderRadius: 20,
    height: 40,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'semibold',
    marginLeft: SPACING.xs,
  },
  iconButton: {
    marginRight: SPACING.sm,
  },
  iconButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  dropdownIcon: {
    marginLeft: SPACING.xs,
  },
});