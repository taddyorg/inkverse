import { CreatorDetails } from './CreatorDetails';
import type { ComicIssue, Creator } from '@inkverse/shared-client/graphql/operations';
import { CREATOR_NOTE_CONFIG, SanitizedHtml } from '@/app/components/ui/SanitizedHtml';

type CreatorsForIssueProps = {
  comicissue?: ComicIssue | null | undefined;
  creators?: Creator[] | null | undefined;
}

export function CreatorsForIssue(props: CreatorsForIssueProps){
  const { comicissue, creators } = props;

  if (!creators) return null;

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
          <SanitizedHtml
            html={comicissue.creatorNote}
            config={CREATOR_NOTE_CONFIG}
            className="prose prose-sm max-w-none creator-note"
          />
        </div>
      )}
    </div>
  );
}