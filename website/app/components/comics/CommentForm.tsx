import React, { useState } from 'react';

interface CommentFormProps {
  isReply?: boolean;
  isEdit?: boolean;
  onSubmit: (text: string) => Promise<void>;
  isSubmitting: boolean;
  isAuthenticated: boolean;
  placeholder?: string;
  initialText?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  className?: string;
}

export function CommentForm({
  isReply = false,
  isEdit = false,
  onSubmit,
  isSubmitting,
  isAuthenticated,
  placeholder = 'Write a comment...',
  initialText = '',
  autoFocus = false,
  onCancel,
  className = '',
}: CommentFormProps) {
  const [text, setText] = useState(initialText);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    await onSubmit(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
    // Cancel on Escape
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  const handleSignInClick = () => {
    window.dispatchEvent(new Event('openSignupModal'));
  };

  // Show sign-in prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className={`relative bg-white dark:bg-transparent rounded-xl px-4 ${className}`}>
        <button
          type="button"
          onClick={handleSignInClick}
          className={`w-full px-4 py-3 rounded-xl border-2 border-inkverse-black/50 dark:border-gray-700 min-h-[100px]
            bg-white dark:bg-transparent
            text-gray-400 dark:text-gray-500
            hover:border-brand-pink dark:hover:border-taddy-blue
            hover:text-gray-600 dark:hover:text-gray-400
            transition-all cursor-pointer
            flex items-center justify-center
          `}
        >
          <span className="text-base">Sign in to comment...</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`relative bg-white dark:bg-transparent rounded-xl px-4 ${className}`}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        autoFocus={autoFocus}
        rows={3}
        className={`w-full px-4 py-3 rounded-xl border-2 border-inkverse-black/50 dark:border-gray-700 resize-none transition-all min-h-[100px]
          bg-white dark:bg-gray-800/70
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-0 focus:border-brand-pink dark:focus:border-taddy-blue
        `}
      />

      <div className="flex items-center justify-end mt-2">
        <div className="flex items-center gap-2 mr-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-pink dark:bg-taddy-blue text-white rounded-full
            hover:bg-brand-pink-dark dark:hover:bg-taddy-blue-dark
            disabled:opacity-50
            transition-colors shadow-sm hover:shadow-md"
        >
          {isSubmitting
            ? <div className="animate-spin rounded-full h-4 w-4" />
            : <span className="text-sm font-semibold">{isReply ? 'Reply' : isEdit ? 'Edit comment' : 'Add comment'}</span>
          }
        </button>
      </div>
    </form>
  );
}
