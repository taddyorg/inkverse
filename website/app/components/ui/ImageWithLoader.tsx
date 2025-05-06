import React, { useState, useRef, useEffect } from 'react';

interface ImageWithLoaderProps {
  src: string;
  className?: string;
  placeholderClassName?: string;
  priority?: 'high' | 'low' | 'auto';
}

export const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({
  src,
  className,
  placeholderClassName = 'flex w-full aspect-1 justify-center items-center',
  priority = 'auto'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  const onLoaded = () => {
    setIsLoaded(true);
  };

  return (
    <div>
      {!isLoaded && 
        <div className={placeholderClassName}>
          <svg className="animate-spin h-5 w-5 ml-2 mr-1" viewBox="0 0 24 24">
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      }
      <img
        className={className}
        ref={imageRef}
        src={src}
        onLoad={onLoaded}
        fetchPriority={priority}
      />
    </div>
  );
};