import { NotionAPI } from 'notion-client';
import { NotionPage } from '@inkverse/public/notion';
import { arrayToObject } from '@inkverse/public/utils';

const notion = new NotionAPI();
const pages = Object.values(NotionPage);
const pagesObject = arrayToObject(pages, 'path') as Record<string, any>;

export async function getNotionPageById(id: string) {
  const page = pagesObject[id];
  if (!page) {
    throw new Error(`Notion page not found for id: ${id}`);
  }
  return await notion.getPage(page.id);
}