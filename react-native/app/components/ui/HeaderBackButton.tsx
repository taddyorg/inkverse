import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';
import { Ionicons } from '@expo/vector-icons';
import { PressableOpacity } from './PressableOpacity';

export function HeaderBackButton({ onPress, backButtonVisualStyle, style }: { onPress?: () => void; backButtonVisualStyle?: StyleProp<ViewStyle>; style?: StyleProp<ViewStyle> }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.backButtonPosition, style]}>
      <PressableOpacity
        style={[styles.backButtonVisual, backButtonVisualStyle]}
        onPress={onPress || (() => navigation.goBack())}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </PressableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backButtonPosition: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 1,
  },
  backButtonVisual: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
}); 