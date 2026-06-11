import chalk from 'chalk'

import { getUserPkgManager } from './getUserPkgManager.js'

import { TITLE_TEXT } from '../consts.js'

export const renderTitle = () => {
    // resolves weird behavior where the ascii is offset
    const pkgManager = getUserPkgManager()
    if (pkgManager === 'yarn' || pkgManager === 'pnpm') {
        console.log('')
    }
    console.log(chalk.hex('#8ad17a')(TITLE_TEXT))
}
