import { TITLE_TEXT } from '@cli/consts.js'
import { getUserPkgManager } from '@cli/utils/getUserPkgManager.js'
import gradient from 'gradient-string'

import { colors } from '@open-condo/ui/colors'

const themeColors = {
    blue: colors.blue[5],
    cyan: '#89ddff',
    green: colors.green[3],
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
