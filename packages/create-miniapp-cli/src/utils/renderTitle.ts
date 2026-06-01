import gradient from 'gradient-string'

import { getUserPkgManager } from './getUserPkgManager.js'

import { TITLE_TEXT } from '../consts.js'

const themeColors = {
    blue: '#3f8cff',
    cyan: '#89ddff',
    green: '#8ad17a',
    magenta: '#fae4fc',
    red: '#d0679d',
    yellow: '#fffac2',
}

export const renderTitle = () => {
    const gradientTitle = gradient(Object.values(themeColors))

    // resolves weird behavior where the ascii is offset
    const pkgManager = getUserPkgManager()
    if (pkgManager === 'yarn' || pkgManager === 'pnpm') {
        console.log('')
    }
    console.log(gradientTitle.multiline(TITLE_TEXT))
}
