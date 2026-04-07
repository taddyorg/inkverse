import { StyleSheet, View, ViewStyle, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableOpacity } from '../ui/PressableOpacity';
import { Colors } from '@/constants/Colors';

interface HeaderSettingsButtonProps {
  onSettingsPress: () => void;
  onNotificationsPress: () => void;
  containerStyle?: ViewStyle;
}

export function HeaderSettingsButton({ onSettingsPress, onNotificationsPress, containerStyle }: HeaderSettingsButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const iconColor = colorScheme === 'light' ? Colors.light.text : Colors.dark.text;

  return (
    <View style={[styles.settingsButtonPosition, containerStyle]}>
      <View style={styles.settingsButtonRow}>
        <PressableOpacity
          style={styles.settingsButtonVisual}
          onPress={onNotificationsPress}>
          <Ionicons name="notifications-outline" size={28} color={iconColor} />
        </PressableOpacity>
        <PressableOpacity
          style={styles.settingsButtonVisual}
          onPress={onSettingsPress}>
          <Ionicons name="settings-outline" size={28} color={iconColor} />
        </PressableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsButtonPosition: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  settingsButtonRow: {
    flexDirection: 'row',
  },
  settingsButtonVisual: {
    padding: 8,
    borderRadius: 20,
  },
}); 