import React, { useState, useReducer, useEffect, useRef } from 'react';
import { ReportType } from '@inkverse/shared-client/graphql/operations';
import { getUserApolloClient } from '@/lib/apollo/client.client';
import { submitReportComicSeries, submitReportComment, reportReducer, reportInitialState, resetReport } from '@inkverse/shared-client/dispatch/reports';
import { IoClose } from 'react-icons/io5';

const COMIC_SERIES_REPORT_CONFIG = {
  title: 'Report this Comic',
  prompt: 'Why are you reporting this comic?',
  staringPhrase: 'This comic',
  types: [
    { type: ReportType.COMICSERIES_INTELLECTUAL_PROPERTY_VIOLATION, label: 'violates intellectual property rights' },
    { type: ReportType.COMICSERIES_GENERATIVE_AI_CONTENT, label: 'contains generative AI content' },
    { type: ReportType.COMICSERIES_CONTAINS_SEXUALLY_EXPLICIT_CONTENT, label: 'contains genitalia, breasts or depicts a sex act' },
    { type: ReportType.COMICSERIES_DECEPTIVE_OR_FRAUDULENT_CONTENT, label: 'is deceptive or fraudulent' },
    { type: ReportType.COMICSERIES_CONTAINS_HATE_SPEECH, label: 'contains hate speech' },
    { type: ReportType.COMICSERIES_IS_SPAM, label: 'is spam' },
    { type: ReportType.COMICSERIES_CONTAINS_UNLAWFUL_CONTENT, label: 'contains unlawful content' },
  ],
};

const COMMENT_REPORT_CONFIG = {
  title: 'Report this Comment',
  prompt: 'Why are you reporting this comment?',
  staringPhrase: 'This comment',
  types: [
    { type: ReportType.COMMENT_SPAM, label: 'is spam' },
    { type: ReportType.COMMENT_HARASSMENT, label: 'harasses me, or another user' },
    { type: ReportType.COMMENT_SPOILER, label: 'contains a spoiler that reveals important plot points' },
    { type: ReportType.COMMENT_MEAN_OR_RUDE, label: 'is unnecessarily mean or rude' },
  ],
};

type ReportModalProps =
  | {
      variant: 'comicseries';
      isOpen: boolean;
      onClose: () => void;
      uuid: string;
    }
  | {
      variant: 'comment';
      isOpen: boolean;
      onClose: () => void;
      commentUuid: string;
    };

export function ReportModal(props: ReportModalProps) {
  const { isOpen, onClose } = props;
  const config = props.variant === 'comicseries' ? COMIC_SERIES_REPORT_CONFIG : COMMENT_REPORT_CONFIG;

  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [reportState, reportDispatch] = useReducer(reportReducer, reportInitialState);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReportType(null);
      setAdditionalInfo('');
      resetReport(reportDispatch);
    }
  }, [isOpen]);

  // Handle body scroll locking
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
    
    if (isOpen) {
      // Get width of scrollbar
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Add padding to prevent layout shift when scrollbar disappears
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before opening the modal
      const activeElement = document.activeElement as HTMLElement;
      
      // Focus the first focusable element in the modal
      setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 0);
      
      // Return focus to the previously focused element when closing
      return () => {
        activeElement?.focus?.();
      };
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Close on ESC key
      if (event.key === 'Escape') {
        onClose();
      }
      
      // Trap focus inside modal
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        // Shift + Tab on first element should focus last element
        if (event.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        } 
        // Tab on last element should focus first element
        else if (!event.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!selectedReportType) return;

    const userClient = getUserApolloClient();
    if (!userClient) return;

    switch (props.variant) {
      case 'comicseries': {
        const { uuid } = props;
        if (!uuid) return;

        try {
          await submitReportComicSeries({ userClient, uuid, reportType: selectedReportType }, reportDispatch);
        } catch (error) {
          console.error('Error submitting report:', error);
        }
        break;
      }
      case 'comment': {
        const { commentUuid } = props;

        try {
          await submitReportComment({
            userClient,
            commentUuid,
            reportType: selectedReportType,
            additionalInfo: additionalInfo.trim() || null,
          }, reportDispatch);
        } catch (error) {
          console.error('Error submitting report:', error);
        }
        break;
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isSubmitting = reportState.isSubmitting;

  const renderComicSeriesContent = () => {
    if (reportState.success) {
      return (
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Thank you for your report
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            We'll review this comic and get back to you shortly.
          </p>
        </div>
      );
    }
    return (
      <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {config.prompt}
      </p>
      <div className="space-y-3">
        {COMIC_SERIES_REPORT_CONFIG.types.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setSelectedReportType(type)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-base ${
              selectedReportType === type
                ? 'bg-brand-pink text-white dark:bg-taddy-blue dark:text-white'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            {config.staringPhrase} {label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground mb-4">
        See our content guidelines <a href="/terms-of-service/content-policy" className="text-brand-pink dark:text-taddy-blue" target="_blank" rel="noopener noreferrer">here</a>.
      </p>
      <div className="mt-4">
        <button
          onClick={handleSubmit}
          disabled={!selectedReportType || isSubmitting}
          className={`w-full px-4 py-3 text-base font-medium text-white rounded-lg transition-colors ${
            !selectedReportType || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-brand-pink hover:bg-brand-pink-dark dark:bg-taddy-blue dark:hover:bg-taddy-blue-dark'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </>
    );
  };

  const renderCommentContent = () => {
    if (reportState.success) {
      return (
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Thank you for your report
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            We'll review this comment and get back to you shortly.
          </p>
        </div>
      );
    }
    return (
      <>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {config.prompt}
        </p>
        <div className="space-y-2">
          {COMMENT_REPORT_CONFIG.types.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setSelectedReportType(type)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedReportType === type
                  ? 'bg-brand-pink text-white dark:bg-taddy-blue'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="font-medium text-sm">{config.staringPhrase} {label}</div>
            </button>
          ))}
        </div>
        {reportState.error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{reportState.error}</p>
        )}
        <div className="mt-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedReportType || isSubmitting}
            className={`w-full px-4 py-3 text-base font-medium text-white rounded-lg transition-colors ${
              !selectedReportType || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-brand-pink hover:bg-brand-pink-dark dark:bg-taddy-blue dark:hover:bg-taddy-blue-dark'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-md mx-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={initialFocusRef}
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <IoClose className="w-5 h-5" />
        </button>

        <h2 id="report-modal-title" className="text-xl font-semibold mb-3 pr-10">
          {config.title}
        </h2>

        {props.variant === 'comicseries' ? renderComicSeriesContent() : renderCommentContent()}
      </div>
    </div>
  );
} 