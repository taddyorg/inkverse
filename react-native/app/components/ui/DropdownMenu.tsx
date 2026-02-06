import { useState, useRef } from 'react';
import { StyleSheet, View, Modal, Pressable } from 'react-native';

import { ThemedText, ThemedTextFontFamilyMap } from './ThemedText';
import { PressableOpacity } from './PressableOpacity';
import { Colors, useThemeColor } from '@/constants/Colors';

export const DropdownMenu = <T extends string>({ options, selected, onSelect, icon, hideArrow }: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  icon?: React.ReactNode;
  hideArrow?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<View>(null);
  const actionColor = useThemeColor({}, 'action');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = Colors.light.text;

  const selectedLabel = options.find((o) => o.value === selected)?.label ?? '';

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPosition({ top: y + height + 4, left: x });
      setOpen(true);
    });
  };

  return (
    <>
      <PressableOpacity onPress={handleOpen}>
        <View ref={triggerRef} style={[styles.dropdownTrigger, { backgroundColor: 'rgba(255, 255, 255, 0.80)' }]}>
          {icon}
          <ThemedText style={[styles.dropdownTriggerText, { color: textColor }]}>
            {selectedLabel} {hideArrow ? '' : '\u25BE'}
          </ThemedText>
        </View>
      </PressableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.dropdownBackdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.dropdownMenu,
              { top: dropdownPosition.top, left: dropdownPosition.left, backgroundColor, shadowColor: textColor },
            ]}
          >
            {options.map((option) => {
              const isSelected = option.value === selected;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.dropdownMenuItem, isSelected && { backgroundColor: actionColor + '15' }]}
                  onPress={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                >
                  <ThemedText style={[styles.dropdownMenuItemText, isSelected && { color: actionColor, fontFamily: ThemedTextFontFamilyMap.bold }]}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dropdownTriggerText: {
    fontSize: 16,
    fontFamily: ThemedTextFontFamilyMap.semiBold,
  },
  dropdownBackdrop: {
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    minWidth: 140,
    borderRadius: 10,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  dropdownMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownMenuItemText: {
    fontSize: 15,
  },
});
