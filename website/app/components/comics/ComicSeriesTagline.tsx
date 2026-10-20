import { useState, useEffect, lazy, Suspense } from 'react';
import { MdEdit } from 'react-icons/md';

import type { ComicSeries } from '@inkverse/shared-client/graphql/operations';
import { canEditComicSeriesTagline } from '@inkverse/shared-client/dispatch/tagline';
import { on, off, EventNames, type PubSubEvents } from '@inkverse/shared-client/pubsub/index';
import { getUserDetails, isAdminDevice } from '@/lib/auth/user';

// Only creators of the series and admins can edit the tagline, so load the modal on demand
const EditTaglineModal = lazy(() => import('../ui/EditTaglineModal').then(m => ({ default: m.EditTaglineModal })));

interface ComicSeriesTaglineProps {
  comicseries: ComicSeries;
}

export function ComicSeriesTagline({ comicseries }: ComicSeriesTaglineProps) {
  const [tagline, setTagline] = useState(comicseries.tagline);
  const [canEdit, setCanEdit] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setTagline(comicseries.tagline);
  }, [comicseries.uuid, comicseries.tagline]);

  // Show the edit icon to admins, and to creators of the series once a tagline is set. Visual only, the server checks permissions on save.
  useEffect(() => {
    const currentUser = getUserDetails();
    if (!currentUser) return;
    setCanEdit(canEditComicSeriesTagline({ isAdmin: isAdminDevice(), userCreatorUuid: currentUser.creator?.uuid, tagline, comicseries }));
  }, [comicseries.uuid, tagline]);

  // Show a saved tagline right away
  useEffect(() => {
    const handleTaglineUpdated = ({ seriesUuid, tagline }: PubSubEvents['COMIC_TAGLINE_UPDATED']) => {
      if (seriesUuid !== comicseries.uuid) return;
      setTagline(tagline);
    };
    on(EventNames.COMIC_TAGLINE_UPDATED, handleTaglineUpdated);
    return () => {
      off(EventNames.COMIC_TAGLINE_UPDATED, handleTaglineUpdated);
    };
  }, [comicseries.uuid]);

  if (!tagline && !canEdit) return null;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {!!tagline && (
        <p className="min-w-0 font-semibold text-lg text-center">{tagline}</p>
      )}
      {canEdit && (
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="shrink-0 p-1 hover:opacity-80 transition-opacity duration-100"
          aria-label="Edit tagline">
          <MdEdit className="h-4 w-4" />
        </button>
      )}
      {isEditModalOpen && (
        <Suspense fallback={null}>
          <EditTaglineModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            seriesUuid={comicseries.uuid}
            currentTagline={tagline}
          />
        </Suspense>
      )}
    </div>
  );
}
