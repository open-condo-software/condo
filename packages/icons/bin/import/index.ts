import { execSync } from 'child_process'
import path from 'path'

import { transform } from '@svgr/core'
import chalk from 'chalk'
import dotenv from 'dotenv'
import fs from 'fs-extra'



import { getSVGData, downloadSVGs } from './getSVGData'
import config from './svgr.config'
import { fillTemplate } from './template'


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
const ENTRY_PATH = path.join(__dirname, '../..', 'src/index.ts')
const CODEGEN_COMMENT = '/** This file is auto-generated. Do not edit it directly **/'
const TYPE_EXPORT = 'export type { IconProps } from \'./wrappers\''

console.log(chalk.magentaBright('-> Fetching metadata from Figma...'))
getSVGData({
    apiToken: FIGMA_API_TOKEN,
    fileId: FIGMA_FILE_ID,
    pageName: FIGMA_PAGE_NAME,
    componentPrefix: FIGMA_COMPONENT_PREFIX,
}).then((data) => {
    console.log(chalk.blueBright('-> Downloading SVGs from cloud service...'))
    return downloadSVGs(data)
}).then(async (data) => {
    console.log(chalk.cyanBright('-> Generating React components...'))
    data.forEach(svg => {
        const svgCode = svg.data
        const componentName = svg.name
        const fileName = `${componentName}.tsx`
        const jsCode = transform.sync(svgCode, config, { componentName })
        // NOTE: for some reason returned markup starts with ;
        const jsCodeFiltered = jsCode.replace(/(^;)|(\n$)/gm, '')
        const componentCode = fillTemplate({ componentName, jsx: jsCodeFiltered })
        fs.ensureDirSync(ICONS_PATH)
        fs.outputFileSync(
            // this script running only by developers to pull icons from the upstream source
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            path.join(ICONS_PATH, fileName),
            componentCode
        )
    })

    console.log(chalk.redBright('-> Generating entry file...'))
    const names = [...new Set(data.map(svg => svg.name))]
    names.sort() // NOSONAR
    const exports = names.map(name => `export { ${name} } from './components/${name}'`).join('\n')
    const indexContent = [CODEGEN_COMMENT, TYPE_EXPORT, exports].join('\n')
    fs.outputFileSync(
        ENTRY_PATH,
        indexContent,
    )

    console.log(chalk.yellowBright('-> Fixing indentations with eslint...'))
    execSync('eslint packages/icons/src --fix', { cwd: path.join(__dirname, '../../../..') })
    console.log(chalk.greenBright('ALL DONE! ✅'))
})

