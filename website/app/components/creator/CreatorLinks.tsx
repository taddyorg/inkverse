import React from 'react';

import { LinkType, type LinkDetails } from '@inkverse/shared-client/graphql/operations';
import { linkIconNames } from '@inkverse/shared-client/utils/link-icons';

type CreatorLinksProps = {
  links?: LinkDetails[];
}

export function CreatorLinks({ links }: CreatorLinksProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="mt-4 flex flex-row gap-8 justify-center flex-wrap">
      {links.map((link) => (
        link?.url && link?.type && (
          <a 
            key={link.url} 
            href={link.type === LinkType.EMAIL ? `mailto:${link.url}` : link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-pink-500 transition-colors duration-200"
            title={link.type.toLowerCase()}>
            <img 
              src={`https://ax0.taddy.org/brands/${linkIconNames[link.type]}.svg`} 
              alt={link.type.toLowerCase()} 
              className="w-6 h-6 dark:brightness-0 dark:invert"
            />
          </a>
        )
      ))}
    </div>
  );
} 