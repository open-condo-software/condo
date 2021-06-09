const { generate, grey, green, gold, blue, red } = require('@ant-design/colors')

const generateCustomColorPalette = (primaryColor, secondaryColor) => {
    const colorPalette = generate(primaryColor)

    if (secondaryColor) {
        colorPalette[6] = secondaryColor
    }

    return colorPalette
}

const sberBlue = '#5EB1FC'
const sberSecondaryBlue = '#3899F1'
const sberGreen = '#4CD174'
const sberSecondaryGreen = '#22BB50'
const sberRed = '#FF4D4F'
const white = '#fff'
const lightGrey = '#D9D9D9'
const sberGrey = '#999999'
const ultraLightGrey = '#F0F0F0'
const inputBorderGrey = '#BFBFBF'
const black = '#000'
const beautifulBlue = '#eFF7FF'
const markColor = '#B5CCFF'

const colors = {
    sberDefault: generateCustomColorPalette(sberBlue, sberSecondaryBlue),
    sberPrimary: generateCustomColorPalette(sberGreen, sberSecondaryGreen),
    sberDanger: generate(sberRed),
    sberGrey: generate(sberGrey),
    defaultWhite: generate(white),
    lightGrey: generate(lightGrey),
    beautifulBlue: generate(beautifulBlue),
    markColor,
    white,
    black,
    gold,
    red,
    blue,
    green,
    ultraLightGrey,
    inputBorderGrey,
}

// Possible customizations can be found at https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
const antGlobalVariables = {
    '@border-radius-base': '4px',
    '@white': white,
    '@black': black,
    // TOOD(Dimitreee):find cleanest solution to override default large form styles without !important 22px !important
    '@form-item-label-height': '@input-height-base',
    '@label-color': grey[2],
    '@input-border-color': inputBorderGrey,
    '@input-bg': ultraLightGrey,
    '@input-hover-border-color': sberGreen,
    '@select-background': ultraLightGrey,
    '@select-clear-background': ultraLightGrey,
    '@select-border-color': inputBorderGrey,
    '@outline-color': sberGreen,
    '@outline-fade:': 0,
    '@outline-width': '1px',
    '@checkbox-color': sberGreen,
    '@checkbox-check-bg': ultraLightGrey,
    '@checkbox-border-width': '2px',
    '@form-item-margin-bottom': '0',
    '@success-color': green[6],
    '@table-border-color': colors.lightGrey[5],
    '@table-header-bg': ultraLightGrey,
    '@tabs-highlight-color': '@black',
    '@tabs-hover-color': '@black',
    '@tabs-active-color': '@black',    
    '@tabs-ink-bar-color': '@black',
    '@switch-color': sberGreen,
    '@alert-error-border-color': '@red-2',
    '@alert-error-bg-color': '@red-2',
    '@alert-info-border-color': '@blue-2',
    '@alert-info-bg-color': '@blue-2',
    '@alert-success-border-color': '@green-2',
    '@alert-success-bg-color': '@green-2',
    '@alert-warning-border-color': '@gold-2',
    '@alert-warning-bg-color': '@gold-2',
}

module.exports = {
    colors,
    antGlobalVariables,
}
