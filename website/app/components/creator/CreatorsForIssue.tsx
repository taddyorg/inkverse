import { CreatorDetails } from './CreatorDetails';
import type { ComicIssue, Creator } from '@inkverse/shared-client/graphql/types';
import * as DOMPurifyModule from 'dompurify';
import { useMemo } from 'react';

// Handle SSR - DOMPurify needs a window object
const DOMPurify = typeof window !== 'undefined' ? DOMPurifyModule.default : null;

type CreatorsForIssueProps = {
  comicissue?: ComicIssue | null | undefined;
  creators?: Creator[] | null | undefined;
}

export function CreatorsForIssue(props: CreatorsForIssueProps){
  const { comicissue, creators } = props;

  if (!creators) return null;

  // Sanitize HTML content with security measures
  const sanitizedCreatorNote = useMemo(() => {
    if (!comicissue?.creatorNote || typeof window === 'undefined') return '';
    
    try {
      // For plain text (no HTML tags), we still need to sanitize but can optimize the display
      const isPlainText = !/<[a-z][\s\S]*>/i.test(comicissue.creatorNote);
      
      // Fix any potential mismatched quotes in links
      let fixedHtml = comicissue.creatorNote
        .replace(/<a\s+href=['"]([^'"]*)['"]\s*>/gi, '<a href="$1">') // Standardize href attributes
        .replace(/<a\s+href=['"]([^'"]*)['"]/gi, '<a href="$1"'); // Fix unclosed quotes
      
      const purifyConfig = {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'a', 'ul', 'ol', 'li', 'b', 'i', 'strong', 'em', 'br', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'style'],
        ADD_ATTR: ['target', 'rel', 'class'],
        ADD_TAGS: ['style']
      };
      
      // Always sanitize content, even plain text
      if (!DOMPurify) return '';
      
      // For plain text, simply sanitize and return (skip DOM processing)
      if (isPlainText) {
        return DOMPurify.sanitize(comicissue.creatorNote, purifyConfig);
      }
      
      const clean = DOMPurify.sanitize(fixedHtml, purifyConfig);
      // Only run DOM operations on the client side
      if (typeof window !== 'undefined') {
        const doc = new DOMParser().parseFromString(clean, 'text/html');
        const links = doc.getElementsByTagName('a');
        
        for (let i = 0; i < links.length; i++) {
          links[i].setAttribute('target', '_blank');
          links[i].setAttribute('rel', 'noopener noreferrer');
        }
        
        return doc.body.innerHTML;
      }
      return clean;
    } catch (error) {
      console.error('HTML sanitization error:', error);
      return '';
    }
  }, [comicissue?.creatorNote]);

  return (
    <div>
      <div className="flex flex-row flex-wrap gap-4 mt-4">
        {creators?.map((creator) => (
          <CreatorDetails
            key={creator.uuid}
            creator={creator} 
            pageType={'mini-creator'} 
          />
        ))}
      </div>

      {comicissue?.creatorNote && (
        <div className="mt-4">
          <style>
            {`
              .creator-note a {
                color: var(--taddy-blue, #3b82f6);
                text-decoration: none;
              }
              .creator-note a:hover {
                opacity: 0.8;
              }
            `}
          </style>
          <div 
            className="prose prose-sm max-w-none creator-note"
            dangerouslySetInnerHTML={{ __html: sanitizedCreatorNote }}
          />
        </div>
      )}
    </div>
  );
}