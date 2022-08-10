import { addons } from '@storybook/addons'
import condoTheme from './theme'

addons.setConfig({
    theme: condoTheme,
})

const link = document.createElement('link')
link.setAttribute('rel', 'shortcut icon')
link.setAttribute('href', 'https://condo.d.doma.ai/favicon.ico')
document.head.appendChild(link)
