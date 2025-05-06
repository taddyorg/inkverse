import { StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableOpacity } from '../ui/PressableOpacity';
import { Colors } from '@/constants/Colors';

interface HeaderSettingsButtonProps {
  onPress: () => void;
}

export function HeaderSettingsButton({ onPress }: HeaderSettingsButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const iconColor = colorScheme === 'light' ? Colors.light.text : Colors.dark.text;

  return (
    <PressableOpacity 
      style={styles.settingsButton} 
      onPress={onPress}>
      <Ionicons name="settings-outline" size={28} color={iconColor} />
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    position: 'absolute',
    top: 44,
    right: 16,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
  },
}); 