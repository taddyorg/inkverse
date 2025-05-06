import { NotionRenderer } from 'react-notion-x'
import { Code } from 'react-notion-x/build/third-party/code';
import { NotionPage } from "@inkverse/public/notion";
import { arrayToObject } from "@inkverse/public/utils";

const pages = Object.values(NotionPage);
const pagesObject = arrayToObject(pages, 'id') as Record<string, any>;

type NotionWrapperProps = {
    blockText: string
}

export function NotionWrapper({ blockText }: NotionWrapperProps) {
  const recordMap = JSON.parse(blockText);
  return (
    <>
      <NotionRenderer 
        recordMap={recordMap} 
        fullPage
        mapPageUrl={(pageId) => {
          const cleanedUpPageId = pageId.split('-').join('');
          return pagesObject[cleanedUpPageId]?.path;
        }} 
        components={{ Code }}
      />
    </>
  );
}