import { NotionAPI } from 'notion-client';
import { NotionPage } from '@inkverse/public/notion';
import { arrayToObject } from '@inkverse/public/utils';

// Notion bot-blocks requests that don't carry a browser-like User-Agent (403 Forbidden on
// /api/v3/loadPageChunk). notion-client merges these headers into every request it makes,
// so this covers page chunks, blocks, collection data and signed urls. Do not remove.
const notion = new NotionAPI({
  ofetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
  },
});
const pages = Object.values(NotionPage);
const pagesObject = arrayToObject(pages, 'path') as Record<string, any>;

export async function getNotionPageById(id: string) {
  const page = pagesObject[id];
  if (!page) {
    throw new Error(`Notion page not found for id: ${id}`);
  }
  return await notion.getPage(page.id);
}