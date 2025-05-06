import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableOpacity } from './PressableOpacity';
import { showShareSheet } from '@/lib/share-sheet';
import { InkverseUrlType } from '@inkverse/public/utils';

interface HeaderShareButtonProps {
  type: InkverseUrlType;
  item: any;
  parentItem?: any;
}

export function HeaderShareButton({ type, item, parentItem }: HeaderShareButtonProps) {
  return (
    <PressableOpacity 
      style={styles.shareButton} 
      onPress={() => showShareSheet({ type, item, parentItem })}>
      <Ionicons name="share-outline" size={24} color="black" />
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
});