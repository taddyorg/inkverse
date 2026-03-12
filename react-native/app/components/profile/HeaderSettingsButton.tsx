import { StyleSheet, View, ViewStyle, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableOpacity } from '../ui/PressableOpacity';
import { Colors } from '@/constants/Colors';

interface HeaderSettingsButtonProps {
  onPress: () => void;
  containerStyle?: ViewStyle;
}

export function HeaderSettingsButton({ onPress, containerStyle }: HeaderSettingsButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const iconColor = colorScheme === 'light' ? Colors.light.text : Colors.dark.text;

  return (
    <View style={[styles.settingsButtonPosition, containerStyle]}>
      <PressableOpacity
        style={styles.settingsButtonVisual}
        onPress={onPress}>
        <Ionicons name="settings-outline" size={28} color={iconColor} />
      </PressableOpacity>
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
  settingsButtonVisual: {
    padding: 8,
    borderRadius: 20,
  },
}); 