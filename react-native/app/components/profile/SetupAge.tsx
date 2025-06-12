import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Modal, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { UserAgeRange } from '@inkverse/public/graphql/types';
import { type AuthState } from '@inkverse/shared-client/dispatch/authentication';
import { ThemedText, ThemedButton, PressableOpacity } from '@/app/components/ui';
import { Colors, useThemeColor } from '@/constants/Colors';
import { SPACING } from '@/constants/Spacing';

interface SetupAgeProps {
  ageRange: UserAgeRange | '';
  setAgeRange: (ageRange: UserAgeRange | '') => void;
  birthYear: string;
  setBirthYear: (birthYear: string) => void;
  authState: AuthState;
  onSubmit: () => Promise<void>;
  mode?: 'setup' | 'edit';
  currentAgeRange?: UserAgeRange | null;
  currentBirthYear?: number | null;
  onCancel?: () => void;
}

export function SetupAge({ 
  ageRange, 
  setAgeRange, 
  birthYear, 
  setBirthYear, 
  authState, 
  onSubmit, 
  mode = 'setup', 
  currentAgeRange, 
  currentBirthYear, 
  onCancel 
}: SetupAgeProps) {
  const [showYearPicker, setShowYearPicker] = useState(false);
  const currentYear = new Date().getFullYear();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor(
    { light: Colors.light.text, dark: Colors.dark.text },
    'text'
  );
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const errorColor = useThemeColor(
    { light: '#dc2626', dark: '#ef4444' },
    'text'
  );

  const hasChanges = mode === 'edit' 
    ? ageRange !== currentAgeRange || (ageRange === UserAgeRange.UNDER_18 && parseInt(birthYear) !== currentBirthYear)
    : true;

  const handleSubmit = async () => {
    // Don't submit if no changes in edit mode
    if (mode === 'edit' && !hasChanges) {
      return;
    }
    
    await onSubmit();
  };

  const ageRangeOptions = [
    { label: 'Under 18', value: UserAgeRange.UNDER_18 },
    { label: '18 to 24', value: UserAgeRange.AGE_18_24 },
    { label: '25 to 34', value: UserAgeRange.AGE_25_34 },
    { label: '35+', value: UserAgeRange.AGE_35_PLUS },
  ];

  // Generate years for birth year picker
  const yearOptions = Array.from({ length: 18 }, (_, i) => currentYear - 17 + i);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label} size='title'>
        How old are you?
      </ThemedText>
      
      <View style={styles.ageRangeGrid}>
        {ageRangeOptions.map((option) => (
          <PressableOpacity
            key={option.value}
            onPress={() => setAgeRange(option.value)}
            style={[
              styles.ageRangeButton,
              { 
                borderColor: ageRange === option.value ? tintColor : borderColor + '40',
                borderWidth: ageRange === option.value ? 2 : 1,
              },
              ageRange === option.value && { 
                backgroundColor: tintColor + '20',
                shadowColor: tintColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }
            ]}
          >
            <ThemedText
              style={[
                styles.ageRangeButtonText,
                ageRange === option.value && { color: tintColor }
              ]}
              font={ageRange === option.value ? 'bold' : 'semiBold'}
            >
              {option.label}
            </ThemedText>
          </PressableOpacity>
        ))}
      </View>

      {ageRange === UserAgeRange.UNDER_18 && (
        <View style={styles.birthYearContainer}>
          <ThemedText style={styles.label}>
            Birth Year (some comics are age restricted)
          </ThemedText>
          
          <TouchableOpacity
            onPress={() => setShowYearPicker(true)}
            style={[styles.birthYearButton, { borderColor }]}
          >
            <ThemedText style={styles.birthYearButtonText}>
              {birthYear || 'Select your birth year'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Birth Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <SafeAreaView>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle} font="semiBold">Select Birth Year</ThemedText>
                <TouchableOpacity
                  onPress={() => setShowYearPicker(false)}
                  style={styles.modalCloseButton}
                >
                  <ThemedText style={[styles.modalCloseText, { color: tintColor }]} font="semiBold">
                    Done
                  </ThemedText>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.yearScrollView}>
                {yearOptions.map(year => (
                  <TouchableOpacity
                    key={year}
                    onPress={() => {
                      setBirthYear(year.toString());
                      setShowYearPicker(false);
                    }}
                    style={[
                      styles.yearOption,
                      birthYear === year.toString() && { backgroundColor: tintColor + '20' }
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.yearOptionText,
                        birthYear === year.toString() && { color: tintColor }
                      ]}
                      font={birthYear === year.toString() ? 'semiBold' : 'regular'}
                    >
                      {year}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {mode === 'edit' ? (
        <View style={styles.editButtonContainer}>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.cancelButton, { borderColor }]}
          >
            <ThemedText style={styles.cancelButtonText} font="semiBold">Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedButton
            buttonText={authState.isLoading ? 'Saving...' : 'Save Changes'}
            onPress={handleSubmit}
            disabled={authState.isLoading || !ageRange || !hasChanges}
            style={styles.editButton}
          />
        </View>
      ) : (
        <ThemedButton
          buttonText={authState.isLoading ? 'Saving...' : 'Continue'}
          onPress={handleSubmit}
          disabled={authState.isLoading || !ageRange || (ageRange === UserAgeRange.UNDER_18 && !birthYear)}
          style={styles.submitButton}
        />
      )}

      {/* Server-side errors */}
      {authState.error && (
        <View style={[styles.errorContainer, { backgroundColor: errorColor + '20' }]}>
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {authState.error}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    textAlign: 'center',
    marginBottom: 40,
  },
  ageRangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  ageRangeButton: {
    width: '48%',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageRangeButtonText: {
    fontSize: 16,
  },
  birthYearContainer: {
    marginTop: SPACING.sm,
  },
  birthYearButton: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  birthYearButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
  },
  modalCloseButton: {
    padding: SPACING.sm,
  },
  modalCloseText: {
    fontSize: 16,
  },
  yearScrollView: {
    maxHeight: 300,
  },
  yearOption: {
    padding: SPACING.sm,
  },
  yearOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 24,
  },
  editButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  editButton: {
    flex: 1,
    marginLeft: SPACING.xs,
  },
  cancelButton: {
    flex: 1,
    marginRight: SPACING.xs,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 18,
  },
  errorContainer: {
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: 14,
  },
});