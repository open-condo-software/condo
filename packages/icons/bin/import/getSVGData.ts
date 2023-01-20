import axios from 'axios'
import * as Figma from 'figma-js'
import { processFile } from 'figma-transformer'

const DEFAULT_BATCH_SIZE = 100

type GetSVGDataConfig = {
    apiToken: string
    fileId: string
    pageName: string
    componentPrefix?: string
    batchSize?: number
}

type SVGData = {
    id: string
    url: string
    name: string
}

type SVG = SVGData & {
    data: string
}

/**
 * Converts figma component format like "Icons/24x24/Kebab-case-Name" to React component name like "KebabCaseName"
 * @param name
 */
function extractComponentName (name: string): string {
    const parts = name.split('/')
    const lastPart = parts[parts.length - 1]

    return lastPart.replace(/-./g, substr => substr[1].toUpperCase())
}

export async function getSVGData (config: GetSVGDataConfig): Promise<Array<SVGData>> {
    const client = Figma.Client({ personalAccessToken: config.apiToken })
    const fileData = await client.file(config.fileId)
    const processedData = processFile(fileData.data, config.fileId)

    const page = processedData.shortcuts.pages.find(page => page.type === 'CANVAS' && page.name === config.pageName)
    if (!page) {
        return []
    }

    const allComponents = page.shortcuts?.components
    if (!allComponents) {
        return []
    }

    const filterPrefix = config.componentPrefix || ''
    const filteredComponents = filterPrefix
        ? allComponents.filter(comp => comp.name.startsWith(filterPrefix))
        : allComponents
    if (!filteredComponents.length) {
        return []
    }

    const svgIds = filteredComponents.map(comp => comp.id)
    const batchSize = config.batchSize || DEFAULT_BATCH_SIZE
    const batchCount = Math.ceil(filteredComponents.length / batchSize)
    const downloadPromises = Array.from(Array<number>(batchCount), (_, idx) => client.fileImages(config.fileId, {
        format: 'svg',
        ids: svgIds.slice(idx * batchSize, (idx + 1) * batchSize),
    }))

    return (await Promise.all(downloadPromises)).flatMap((response, idx) => {
        const svgUrls = response.data.images
        const components = filteredComponents.slice(idx * batchSize, (idx + 1) * batchSize)

        return components.map(comp => ({
            id: comp.id,
            url: svgUrls[comp.id],
            name: extractComponentName(comp.name),
        }))
    })
}

export async function downloadSVGs (data: Array<SVGData>): Promise<Array<SVG>> {
    return Promise.all(data.map(async item => {
        const downloadedSVG = await axios.get<string>(item.url)

        return {
            ...item,
            data: downloadedSVG.data,
        }
    }))
}