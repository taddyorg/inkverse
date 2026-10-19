import { useEffect, useRef, useState } from 'react';

interface ExpandableTextProps {
  text: string;
  numberOfLines: number;
  className?: string;
}

// Clamps long text to numberOfLines and ends it with an inline "… more" that expands it, and a "Show less" that collapses it again (on the last line if it fits, otherwise below)
export function ExpandableText({ text, numberOfLines, className }: ExpandableTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Measure after mount (and on resize) so the server render and first client render match
  useEffect(() => {
    const element = textRef.current;
    if (!element || isExpanded) { return; }
    const measure = () => setIsTruncated(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, isExpanded]);

  const isClamped = !isExpanded;
  const expand = () => setIsExpanded(true);
  const collapse = () => setIsExpanded(false);

  return (
    <div className={`relative ${className ?? ''}`}>
      <p
        ref={textRef}
        className={`whitespace-pre-line ${isClamped && isTruncated ? 'cursor-pointer' : 'flow-root'}`}
        style={isClamped ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: numberOfLines, overflow: 'hidden' } : undefined}
        onClick={isClamped && isTruncated ? expand : undefined}
      >
        {text}
        {/* Floated after the text, so it sits on the last line when it fits and wraps below when it doesn't */}
        {isExpanded && isTruncated && (
          <button onClick={collapse} className="float-right ml-3 font-bold">
            Show less
          </button>
        )}
      </p>
      {isClamped && isTruncated && (
        <button
          onClick={expand}
          className="absolute bottom-0 right-0 pl-10 bg-gradient-to-r from-transparent via-paper-pink via-35% to-paper-pink dark:via-inkverse-black dark:to-inkverse-black"
        >
          …{' '}<span className="font-bold">more</span>
        </button>
      )}
    </div>
  );
}
