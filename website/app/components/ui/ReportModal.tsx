import React, { useState, useReducer, useEffect, useRef } from 'react';
import { ReportType, getPrettyReportType } from '@inkverse/public/report';
import { getApolloClient } from '@/lib/apollo/client.client';
import { submitReportComicSeries, reportReducer, reportInitialState, resetReportComicSeries } from '@inkverse/shared-client/dispatch/reports';
import { IoClose } from 'react-icons/io5';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  uuid: string;
  type: 'comicseries' | 'comicissue' | 'creator';
}

export function ReportModal({ isOpen, onClose, uuid, type }: ReportModalProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [reportState, dispatch] = useReducer(reportReducer, reportInitialState);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (reportState.success) {
      onClose();
      resetReportComicSeries(dispatch);
    }
  }, [reportState.success, onClose]);

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
    if (!selectedReportType || !uuid) return;
    
    try {
      const client = getApolloClient();
      if (type === 'comicseries' && client) {
        await submitReportComicSeries({ publicClient: client, uuid, reportType: selectedReportType }, dispatch);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

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
        <h2 id="report-modal-title" className="text-xl font-semibold mb-3 pr-10">Report Content</h2>
        <p className="text-md font-semibold mb-4">Choose a reason for reporting this content:</p>
        
        <div className="space-y-3">
          {Object.values(ReportType).map((reportType) => (
            <button
              key={reportType}
              onClick={() => setSelectedReportType(reportType)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-base ${
                selectedReportType === reportType
                  ? 'bg-brand-pink text-white dark:bg-taddy-blue dark:text-white'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {getPrettyReportType(reportType)}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted-foreground mb-4">
          See our content guidelines <a href="/terms-of-service/content-policy" className="text-brand-pink dark:text-taddy-blue" target="_blank" rel="noopener noreferrer">here</a>.
        </p>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedReportType || reportState.isSubmitting}
            className={`w-full px-4 py-3 text-base font-medium text-white rounded-lg ${
              !selectedReportType || reportState.isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-brand-pink hover:bg-brand-pink-dark dark:bg-taddy-blue dark:hover:bg-taddy-blue-dark'
            }`}
          >
            {reportState.isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
} 