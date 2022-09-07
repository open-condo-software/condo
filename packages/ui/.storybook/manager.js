const { addons } = require('@storybook/addons')
const customTheme = require('./theme')

addons.setConfig({
    theme: customTheme,
})