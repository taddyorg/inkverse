import { get } from "lodash-es";
import { getMetaTags } from "@/lib/seo";
import { additionalInfoForNotionId, type BlogPost } from "@inkverse/public/notion";
import { type GetDocumentationQuery } from "@inkverse/shared-client/graphql/operations";

export function getDocumentMeta(data: GetDocumentationQuery['getDocumentation']) {
  if (!data || !data.id || !data.text) { return []; }

  const recordMap = JSON.parse(data.text);
  const allBlocks: Record<string, any>[] = Object.values(recordMap.block);
  const pageBlockObjects = allBlocks.filter((block: Record<string, any>) => { return block.value && block.value.type === 'page' });
  const mainBlock = get(pageBlockObjects, '[0]', null);
  const titleArray = get(mainBlock, 'value.properties.title', ['Inkverse Webtoons & Webcomics']);
  const title = titleArray.join(' ');
  const description = getDescription(recordMap.block, mainBlock?.value?.content || []);
  const imageURL = getImageUrl(data.id, additionalInfoForNotionId[data.id]);

  return getMetaTags(title, description, `https://inkverse.co${data.id}`, imageURL);
}

export function getDescription(allBlocks: Record<string, any>, blockIds = []): string {
  let description = '';

  for (let blockId of blockIds) {
    const block = allBlocks[blockId]
    if (!block) { break }
    const blockValue = block.value
    const descriptionArrayofArrays = get(blockValue, 'properties.title', []);
    const descriptionArray = descriptionArrayofArrays.map((array: any) => get(array, '[0]', '').trim());
    if (blockValue.type === 'text' && descriptionArray) {
      description = descriptionArray.join(' ');
      break;
    }
  }

  return description;
}

export function getUrlRoot(urlPath: string): string | null {
  const parts = urlPath.split('/');
  const root = get(parts, '[1]', '');
  switch (root) {
    case 'creators':
    case 'careers':
    case 'blog':
      return root
    default:
      return null;
  }
}

export function getImageUrl(urlPath: string, additionalInfo?: BlogPost): string {
  const root = getUrlRoot(urlPath);

  if (additionalInfo && additionalInfo.imageURL) {
    return additionalInfo.imageURL
  }

  switch (root) {
    default:
      return 'https://ink0.inkverse.co/general/inkverse-brandmark-white.png';
  }
}

