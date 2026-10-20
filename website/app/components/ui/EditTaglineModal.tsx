import React, { useState, useReducer, useEffect, useRef } from 'react';
import { IoClose } from 'react-icons/io5';

import { getUserApolloClient } from '@/lib/apollo/client.client';
import { submitComicSeriesTagline, taglineReducer, taglineInitialState, resetTagline } from '@inkverse/shared-client/dispatch/tagline';
import { MAX_TAGLINE_LENGTH, TAGLINE_INVALID_MESSAGE, isValidTagline, normalizeTagline } from '@inkverse/public/comicseries';

interface EditTaglineModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesUuid: string;
  currentTagline: string | null | undefined;
}

export function EditTaglineModal({ isOpen, onClose, seriesUuid, currentTagline }: EditTaglineModalProps) {
  const [tagline, setTagline] = useState(currentTagline ?? '');
  const [taglineState, taglineDispatch] = useReducer(taglineReducer, taglineInitialState);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTagline(currentTagline ?? '');
      resetTagline(taglineDispatch);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Close once the tagline is saved
  useEffect(() => {
    if (taglineState.success) { onClose(); }
  }, [taglineState.success]);

  // Handle body scroll locking
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') { onClose(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userClient = getUserApolloClient();
    if (!userClient) return;
    await submitComicSeriesTagline({ userClient, seriesUuid, tagline }, taglineDispatch);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) { onClose(); }
  };

  if (!isOpen) return null;

  const isSubmitting = taglineState.isSubmitting;
  const isUnchanged = normalizeTagline(tagline) === normalizeTagline(currentTagline ?? '');
  const hasInvalidFormat = tagline.trim() !== '' && !isValidTagline(tagline);
  const errorMessage = hasInvalidFormat ? TAGLINE_INVALID_MESSAGE : taglineState.error;
  const isSaveDisabled = isUnchanged || isSubmitting || hasInvalidFormat;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-tagline-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-md mx-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <IoClose className="w-5 h-5" />
        </button>

        <h2 id="edit-tagline-modal-title" className="text-xl font-semibold mb-3 pr-10">
          Edit Your Tagline
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          In 1 to 3 words, what is this comic? It shows under the cover, e.g. "Romance • Comedy".
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={MAX_TAGLINE_LENGTH}
            placeholder="Romance • Comedy"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-base focus:outline-none focus:ring-2 focus:ring-brand-pink dark:focus:ring-taddy-blue"
          />
          <p className="mt-1 text-xs text-right text-muted-foreground">
            {tagline.length}/{MAX_TAGLINE_LENGTH}
          </p>

          {errorMessage && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSaveDisabled}
            className={`mt-4 w-full px-4 py-3 text-base font-normal text-white rounded-lg transition-colors ${
              isSaveDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-brand-pink hover:bg-brand-pink-dark dark:bg-taddy-blue dark:hover:bg-taddy-blue-dark'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
