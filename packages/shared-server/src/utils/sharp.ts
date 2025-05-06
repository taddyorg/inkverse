import sharp, { type Metadata } from 'sharp';
import axios, { type AxiosRequestConfig } from 'axios';

import { getStoryImageUrl } from '@inkverse/public/comicstory';

import { database } from '../database/index.js';
import type { ComicStoryModel } from '../database/types.js';
import { ComicStory } from '../models/index.js';
 
async function getMultipleHeightAndWidths(comicstories: ComicStoryModel[] ) {
    const trx = await database.transaction()
    try{

        const savedComicStories: Partial<ComicStoryModel>[] = [];

        for (let index = 0; index < comicstories.length; index++) {
            const comicstory = comicstories[index];
            const result = await getHeightAndWidth(comicstory);
            if (result && result.width && result.height) {
                savedComicStories.push(result);
            }
        }
                
        const issueUuids = new Set(savedComicStories.map(comicstory => comicstory.issueUuid))
        const seriesUuids = new Set(savedComicStories.map(comicstory => comicstory.seriesUuid))
        const issueUuidArray = Array.from(issueUuids);
        const seriesUuidArray = Array.from(seriesUuids);
        const issueUuid = issueUuidArray.length === 1 ? issueUuidArray[0] : null;
        const seriesUuid = seriesUuidArray.length === 1 ? seriesUuidArray[0] : null;

        if (!issueUuid || !seriesUuid) {
            throw new Error('getMultipleHeightAndWidths issueUuid or seriesUuid !== 1')
        }

        const safeSavedComicStories: Partial<ComicStoryModel>[] = savedComicStories.map(comicstory => {
            return { 
                uuid: comicstory.uuid,
                issueUuid,
                seriesUuid,
                width: comicstory.width,
                height: comicstory.height
            }
        })

        await ComicStory.updateHeightAndWidthForComicStories(trx, safeSavedComicStories, issueUuid, seriesUuid)
        await trx.commit();

    } catch (e) {
        console.log('getMultipleHeightAndWidths error', e)
        await trx.rollback();
    }
}

async function getHeightAndWidth(comicstory?: ComicStoryModel): Promise<Partial<ComicStoryModel> | null> {
    if (!comicstory) { return null; }

    try {
        const { uuid, issueUuid, seriesUuid, storyImage } = comicstory;
        const imageUrl = getStoryImageUrl({ storyImageAsString: storyImage ? JSON.stringify(storyImage) : null });

        if (!imageUrl) { return null; }

        const options: AxiosRequestConfig = {
            method: 'GET',
            url: imageUrl,
            timeout: 1000 * 5,
            responseType: 'arraybuffer',
            maxContentLength: 10485760
        };

        const response = await axios(options);
        const buffer = Buffer.from(response.data, 'binary');
        const image: Metadata = await sharp(buffer).metadata();
        const { width = null, height = null } = image;
        return { uuid, issueUuid, seriesUuid, width, height };
    } catch (e) {
        console.log('getHeightAndWidth - error downloading image', comicstory && comicstory.uuid)
        return null;
    }
}

export {
    getHeightAndWidth,
    getMultipleHeightAndWidths,
}
