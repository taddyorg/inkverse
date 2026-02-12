import * as DOMPurifyModule from 'dompurify';
import { useMemo, type ComponentPropsWithoutRef } from 'react';

const DOMPurify = typeof window !== 'undefined' ? DOMPurifyModule.default : null;

export interface SanitizeConfig {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
}

export const CREATOR_NOTE_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'a', 'ul', 'ol', 'li', 'b', 'i', 'strong', 'em', 'br', 'img'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'width', 'height'],
};

export const COMMENT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'br', 'img', 'span'],
  ALLOWED_ATTR: ['src', 'alt', 'width', 'height', 'class'],
};

function processSpoilerTags(text: string): string {
  return text.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>');
}

export function useSanitizedHtml(html: string | null | undefined, config: SanitizeConfig = COMMENT_CONFIG): string {
  return useMemo(() => {
    if (!html || typeof window === 'undefined') return '';

    try {
      let processed = processSpoilerTags(html);
      const hasSpoilers = processed !== html;

      const isPlainText = !/<[a-z][\s\S]*>/i.test(html);

      let fixedHtml = processed
        .replace(/<a\s+href=['"]([^'"]*)['"]\s*>/gi, '<a href="$1">')
        .replace(/<a\s+href=['"]([^'"]*)['"]/gi, '<a href="$1"');

      if (!DOMPurify) return '';

      if (isPlainText && !hasSpoilers) {
        return DOMPurify.sanitize(html, config);
      }

      const clean = DOMPurify.sanitize(fixedHtml, config);

      const doc = new DOMParser().parseFromString(clean, 'text/html');
      const links = doc.getElementsByTagName('a');

      for (let i = 0; i < links.length; i++) {
        links[i].setAttribute('target', '_blank');
        links[i].setAttribute('rel', 'noopener noreferrer');
      }

      return doc.body.innerHTML;
    } catch (error) {
      console.error('HTML sanitization error:', error);
      return '';
    }
  }, [html, config]);
}

type SanitizedHtmlProps = ComponentPropsWithoutRef<'div'> & {
  html: string | null | undefined;
  config?: SanitizeConfig;
};

/**
 * Renders HTML that has been sanitized (e.g. via DOMPurify).
 * Encapsulates dangerouslySetInnerHTML in one place so call sites stay safe.
 */
export function SanitizedHtml({ html, config, ...divProps }: SanitizedHtmlProps) {
  const sanitized = useSanitizedHtml(html, config);

  if (!sanitized) return null;

  return <div {...divProps} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
