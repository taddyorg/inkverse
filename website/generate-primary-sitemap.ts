import fs from 'fs';
import { NotionPage, additionalInfoForNotionId } from '@inkverse/public/notion'
import { arrayToObject } from '@inkverse/public/utils'

function getPriority(url: string): string {
  const defaultValue = '0.8';
  const additionalInfo = additionalInfoForNotionId[url];
  return additionalInfo ? (additionalInfo.priority || defaultValue) : defaultValue;
}

const pages = Object.values(NotionPage);
const pagesObject = arrayToObject(pages, 'id') as Record<string, any>;

const excludedUrls = new Set([
  '/', 
]);

const urls = Object.values(pagesObject).filter(url => !excludedUrls.has(url.path));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://inkverse.co</loc>
      <priority>1.0</priority>
    </url>
    ${urls.map(url => `
      <url>
        <loc>https://inkverse.co${url.path}</loc>
        <priority>${getPriority(url.path)}</priority>
      </url>
    `).join('')}
  </urlset>`;

fs.writeFileSync('./assets/primary-sitemap.xml', sitemap);