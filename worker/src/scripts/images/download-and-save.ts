import fs from 'fs'
import readline from 'readline'

import { ComicStory } from '@inkverse/shared-server/models/index'
import { getHeightAndWidth } from '@inkverse/shared-server/utils/sharp'

// Make the main process async
export async function downloadAndSave(outputPath: string): Promise<void> {
    console.log('downloadAndSave', outputPath)

    const start = +new Date();
    console.log('');
    console.log(`[SYNC] /**`)
    console.log(`[SYNC]  * STARTING DOWNLOAD-AND-SAVE PROCESS.`)
    console.log(`[SYNC]  *     args: ${[ outputPath ].join(', ')}`)
    console.log(`[SYNC]  */`)
    
    const fileStream = fs.createReadStream(outputPath, "utf8")
    
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })

    for await (const line of rl) {
        const comicstory = JSON.parse(line)
        const comicstoryWithWidthAndHeight = await getHeightAndWidth(comicstory)
        if (!comicstoryWithWidthAndHeight) continue
        
        const { uuid, issueUuid, seriesUuid, width, height } = comicstoryWithWidthAndHeight
        if (!uuid || !issueUuid || !seriesUuid || !width || !height) continue

        await ComicStory.updateHeightAndWidthForComicStory(uuid, issueUuid, seriesUuid, width, height)
        console.log(`[SYNC] Updated ${uuid} with width ${width} and height ${height}`)
    }

    const end = +new Date();
    console.log(`[SYNC] Finished in ${end - start}ms`)
}