import React, { useState, useReducer, useEffect, useMemo } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/constants/Navigation';
import DropDownPicker from 'react-native-dropdown-picker';

import { Screen, ScreenHeader, ThemedView, ThemedText, HeaderBackButton, ThemedButton } from '../components/ui';
import { ReportType } from '@inkverse/shared-client/graphql/operations';
import { getUserApolloClient } from '@/lib/apollo';
import { reportReducer, reportInitialState, submitReportComicSeries, submitReportComment } from '@inkverse/shared-client/dispatch/reports';
import { BLOG_SCREEN } from '@/constants/Navigation';

// Map report types to human-readable labels for comic series reports
const COMIC_SERIES_REPORT_LABELS: Record<string, string> = {
  [ReportType.COMICSERIES_INTELLECTUAL_PROPERTY_VIOLATION]: 'Violation of intellectual property rights',
  [ReportType.COMICSERIES_GENERATIVE_AI_CONTENT]: 'Contains generative AI content',
  [ReportType.COMICSERIES_CONTAINS_SEXUALLY_EXPLICIT_CONTENT]: 'Contains genitalia, breasts or depicts a sex act',
  [ReportType.COMICSERIES_DECEPTIVE_OR_FRAUDULENT_CONTENT]: 'Deceptive or Fraudulent Content',
  [ReportType.COMICSERIES_CONTAINS_HATE_SPEECH]: 'Contains hate speech',
  [ReportType.COMICSERIES_IS_SPAM]: 'Is Spam',
  [ReportType.COMICSERIES_CONTAINS_UNLAWFUL_CONTENT]: 'Contains unlawful content',
};

// Comic series report types
const COMIC_SERIES_REPORT_TYPES = [
  ReportType.COMICSERIES_INTELLECTUAL_PROPERTY_VIOLATION,
  ReportType.COMICSERIES_GENERATIVE_AI_CONTENT,
  ReportType.COMICSERIES_CONTAINS_SEXUALLY_EXPLICIT_CONTENT,
  ReportType.COMICSERIES_DECEPTIVE_OR_FRAUDULENT_CONTENT,
  ReportType.COMICSERIES_CONTAINS_HATE_SPEECH,
  ReportType.COMICSERIES_IS_SPAM,
  ReportType.COMICSERIES_CONTAINS_UNLAWFUL_CONTENT,
];

// Map report types to human-readable labels for comment reports
const COMMENT_REPORT_LABELS: Record<string, string> = {
  [ReportType.COMMENT_SPAM]: 'Is spam',
  [ReportType.COMMENT_HARASSMENT]: 'Harasses me, or another user',
  [ReportType.COMMENT_SPOILER]: 'Contains a spoiler that reveals important plot points',
  [ReportType.COMMENT_MEAN_OR_RUDE]: 'Is unnecessarily mean or rude',
};

// Comment report types
const COMMENT_REPORT_TYPES = [
  ReportType.COMMENT_SPAM,
  ReportType.COMMENT_HARASSMENT,
  ReportType.COMMENT_SPOILER,
  ReportType.COMMENT_MEAN_OR_RUDE,
];

export type ReportsScreenParams =
  | {
      type: 'comicseries' | 'comicissue' | 'creator';
      uuid: string;
    }
  | {
      type: 'comment';
      commentUuid: string;
    };

export function ReportsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ReportsScreen'>>();

  const { type } = route.params || {};
  const uuid = route.params && 'uuid' in route.params ? route.params.uuid : undefined;
  const commentUuid = route.params && 'commentUuid' in route.params ? route.params.commentUuid : undefined;
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [open, setOpen] = useState(false);
  const [reportState, dispatch] = useReducer(reportReducer, reportInitialState);

  const items = useMemo(() => {
    if (type === 'comment') {
      return COMMENT_REPORT_TYPES.map(reportType => ({
        label: COMMENT_REPORT_LABELS[reportType],
        value: reportType
      }));
    }
    return COMIC_SERIES_REPORT_TYPES.map(reportType => ({
      label: COMIC_SERIES_REPORT_LABELS[reportType],
      value: reportType
    }));
  }, [type]);

  useEffect(() => {
    if (reportState.success) {
      navigation.goBack();
    } else if (reportState.error) {
      Alert.alert(
        "Error",
        "There was an error submitting your report. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, [reportState.success, reportState.error, navigation]);

  const handleSubmitReport = async () => {
    if (!selectedReportType) return;

    const userClient = getUserApolloClient();
    if (!userClient) return;

    if (type === 'comicseries' && uuid) {
      submitReportComicSeries({ userClient, uuid, reportType: selectedReportType }, dispatch);
    } else if (type === 'comment' && commentUuid) {
      submitReportComment({
        userClient,
        commentUuid,
        reportType: selectedReportType,
        additionalInfo: null
      }, dispatch);
    }
  };

  return (
    <Screen>
      <View>
        <HeaderBackButton onPress={() => navigation.goBack()} />
      </View>
      <ScreenHeader />
      <ThemedView style={styles.container}>
        {/* Dropdown Selection using react-native-dropdown-picker */}
        <ThemedText size="subtitle" style={styles.headerTitle}>
          {type === 'comment'
            ? 'Choose a reason for reporting this comment:'
            : 'Choose a reason for reporting this content:'}
        </ThemedText>
        <View style={styles.dropdownContainer}>
          <DropDownPicker
            open={open}
            value={selectedReportType}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedReportType}
            maxHeight={300}
            placeholder="Select a reason"
            style={styles.dropdownButton}
            textStyle={styles.dropdownButtonText}
            dropDownContainerStyle={styles.dropdownList}
            listItemContainerStyle={styles.dropdownItem}
            listItemLabelStyle={styles.dropdownItemLabel}
            closeAfterSelecting={true}
            ListEmptyComponent={() => (
              <ThemedText style={styles.emptyListText}>No options available</ThemedText>
            )}
          />
        </View>

        {type === 'comicseries' && 
          <View style={styles.guidelinesContainer}>
            <ThemedText style={styles.guidelinesText}>
              See our content guidelines{' '}
              <ThemedText 
                style={styles.guidelinesLink}
                onPress={() => navigation.navigate(BLOG_SCREEN, { url: 'https://inkverse.co/terms-of-service/content-policy' })}
              >
                here
              </ThemedText>.
            </ThemedText>
          </View>
        }

        {/* Submit Button */}
        <View style={styles.submitButtonContainer}>
          <ThemedButton
            buttonText={reportState.isSubmitting ? "Submitting..." : "Submit"}
            onPress={handleSubmitReport}
            style={[
              styles.submitButton,
              (!selectedReportType || reportState.isSubmitting) && styles.disabledButton
            ]}
            disabled={!selectedReportType || reportState.isSubmitting}
          />
        </View>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  dropdownContainer: {
    marginTop: 20,
    zIndex: 1000,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    height: 50,
  },
  dropdownButtonText: {
    fontSize: 16,
    paddingHorizontal: 4,
  },
  dropdownList: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  dropdownItemLabel: {
    fontSize: 15,
    flexShrink: 1,
    paddingRight: 5,
    flexWrap: 'wrap',
  },
  emptyListText: {
    padding: 12,
    textAlign: 'center',
  },
  submitButtonContainer: {
    marginTop: 25, // Increased to allow space for the dropdown
    alignItems: 'center', // Center the button horizontally
  },
  submitButton: {
    padding: 16,
    paddingHorizontal: 24,
    alignSelf: 'center', // Allow button to size to content
  },
  disabledButton: {
    opacity: 0.5,
  },
  guidelinesContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  guidelinesText: {
    fontSize: 14,
    textAlign: 'center',
  },
  guidelinesLink: {
    fontSize: 14,
    color: '#FF5E85', // brand-pink color
  },
}); 