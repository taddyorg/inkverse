import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';
import { Ionicons } from '@expo/vector-icons';
import { PressableOpacity } from './PressableOpacity';

export function HeaderBackButton({ onPress }: { onPress?: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.backButtonPosition}>
      <PressableOpacity
        style={styles.backButtonVisual}
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