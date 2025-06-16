import { Share, Platform } from 'react-native';
import { getInkverseUrl, InkverseUrlType } from '@inkverse/public/utils';

export type ShareItem = {
  type: InkverseUrlType;
  item: any;
  parentItem?: any;
}

export function getMessage({ type, item, parentItem }: ShareItem) {
  switch (type) {
    case 'comicseries':
      return `Hey! Check out ${item.name.trim()} on Inkverse.`
    case 'comicissue':
      return `Hey! Check out this episode from ${parentItem.name.trim()} on Inkverse.`
    case 'creator':
      return `Hey! Check out ${item.name.trim()}'s profile on Inkverse.`
    case 'list':
      return `Hey! Check out this list of webtoons on Inkverse.`
    case 'share-inkverse':
      return `Hey! Check out this new webtoons app!`
    default:
      throw new Error('Invalid share type');
  }
}

function getTitle({ type, item, parentItem }: ShareItem) {
  switch (type) {
    case 'comicseries':
      return 'Check out this comic!'
    case 'comicissue':
      return 'Check out this episode!'
    case 'creator':
      return 'Check out this profile!'
    case 'list':
      return 'Check out this list of comics!'
    case 'share-inkverse':
      return 'Check out Inkverse!'
    default:
      throw new Error('Invalid share type');
  }
}

function getUrl({ type, item, parentItem }: ShareItem) {
  switch (type) {
    case 'comicseries':
      if (!item) return undefined;
      return getInkverseUrl({ type: 'comicseries', shortUrl: item.shortUrl });
    case 'comicissue':
      if (!parentItem || !item) return undefined;
      return getInkverseUrl({ type: 'comicissue', shortUrl: parentItem.shortUrl, name: item.name, uuid: item.uuid });
    case 'creator':
      if (!item) return undefined;
      return getInkverseUrl({ type: 'creator', shortUrl: item.shortUrl });
    case 'list':
      if (!item) return undefined;
      return getInkverseUrl({ type: 'list', id: item.id, name: item.name });
    case 'share-inkverse':
      return getInkverseUrl({ type: 'share-inkverse' });
    default:
      throw new Error('Invalid share type');
  }
}

export async function showShareSheet({ type, item, parentItem }: ShareItem) {
  try {
    const message = getMessage({ type, item, parentItem });
    const title = getTitle({ type, item, parentItem });
    const urlPath = getUrl({ type, item, parentItem });
    const fullUrl = `https://inkverse.co${urlPath}`;

    const options = Platform.OS === 'ios' 
      ? {
          message: message,
          url: fullUrl,
          title: title,
        } 
      : {
          message: `${message}\n\n${fullUrl}`,
          title: title,
        };

    const result = await Share.share(options);
    
    // Optional: Handle result for analytics or user feedback
    if (result.action === Share.sharedAction) {
      console.log('Content shared successfully');
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dialog dismissed');
    }
  } catch (err) {
    console.log('Share error:', err);
  }
}