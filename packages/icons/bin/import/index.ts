import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { transform } from '@svgr/core'
import config from './svgr.config'

import { getSVGData, downloadSVGs } from './getSVGData'

dotenv.config()

const FIGMA_API_TOKEN = process.env.FIGMA_API_TOKEN
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID
const FIGMA_PAGE_NAME = process.env.FIGMA_PAGE_NAME
const FIGMA_COMPONENT_PREFIX = process.env.FIGMA_COMPONENT_PREFIX


if (!FIGMA_API_TOKEN || !FIGMA_FILE_ID || !FIGMA_PAGE_NAME) {
    console.error('Environment variables was not set!')
    process.exit(1)
}

const ICONS_PATH = path.join(__dirname, '../..', 'src/components')

console.log(chalk.magentaBright('-> Fetching metadata from Figma...'))
getSVGData({
    apiToken: FIGMA_API_TOKEN,
    fileId: FIGMA_FILE_ID,
    pageName: FIGMA_PAGE_NAME,
    componentPrefix: FIGMA_COMPONENT_PREFIX,
}).then((data) => {
    console.log(chalk.blueBright('-> Downloading SVGs from cloud service'))
    return downloadSVGs(data)
}).then(async (data) => {
    console.log(chalk.cyanBright('-> Generating React components'))
    data.forEach(svg => {
        const svgCode = svg.data
        const componentName = svg.name
        const fileName = `${componentName}.tsx`
        const jsCode = transform.sync(svgCode, config, { componentName })
        fs.ensureDirSync(ICONS_PATH)
        fs.outputFileSync(
            path.join(ICONS_PATH, fileName),
            jsCode
        )
    })
})

