const { generate, grey, green, gold, blue, red, volcano, purple, lime, magenta, cyan, geekblue, yellow, orange } = require('@ant-design/colors')

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
const sberDarkGreen = '#1B7F8B'
const sberSecondaryGreen = '#22BB50'
const sberRed = '#FF4D4F'
const white = '#fff'
const lightGrey = '#D9D9D9'
const sberGrey = '#999999'
const ultraLightGrey = '#F0F0F0'
const inputBorderGrey = '#D0D3E5'
const backgroundLightGrey = '#F2F3F7'
const inputBorderHover = '#989EB7'
const black = '#222'
const textSecondary = '#82879F'
const beautifulBlue = '#eFF7FF'
const markColor = '#B5CCFF'
const lightRed = '#FFF1F0'
const brightRed = '#F5222D'
const sberDangerRed = '#EB3468'
const whiteTranslucent = 'rgba(255, 255, 255, 0.9)'
const indigo = '#5473C3'
const turquoiseBlue = '#6BEAC7'
const selago = '#F1F3FE'
const scampi = '#525FA8'
const zircon = '#F1F3FF'
const logoPurple = '#525FAB'
const backgroundWhiteSecondary = '#E6E8F1'


const CHART_COLOR_SET = [blue[5], green[5], red[4], gold[5], volcano[5], purple[5],
    lime[7], sberGrey, magenta[5], blue[4], gold[6], cyan[6],
    blue[7], volcano[6], green[5], geekblue[7], gold[7],
    magenta[7], yellow[5], lime[7], blue[8], cyan[5], yellow[6],
    purple[7], lime[8], red[6]]

const UNIT_TYPE_COLOR_SET = {
    flat: white,
    parking: white,
    apartment: '#CBE2F6',
    warehouse: '#F086334D',
    commercial: '#EB34684D',
}

const colors = {
    sberDefault: generateCustomColorPalette(sberBlue, sberSecondaryBlue),
    sberPrimary: generateCustomColorPalette(sberGreen, sberSecondaryGreen),
    sberAction: generateCustomColorPalette(sberDarkGreen, sberDarkGreen),
    sberDanger: generate(sberRed),
    sberGrey: generate(sberGrey),
    defaultWhite: generate(white),
    lightGrey: generate(lightGrey),
    beautifulBlue: generate(beautifulBlue),
    transparent: 'transparent',
    markColor,
    white,
    black,
    gold,
    red,
    blue,
    green,
    volcano,
    purple,
    lime,
    magenta,
    cyan,
    geekblue,
    yellow,
    ultraLightGrey,
    inputBorderGrey,
    inputBorderHover,
    whiteTranslucent,
    lightRed,
    brightRed,
    orange,
    indigo,
    turquoiseBlue,
    selago,
    scampi,
    zircon,
    logoPurple,
    sberDangerRed,
    backgroundLightGrey,
    textSecondary,
    backgroundWhiteSecondary,
}

const fontSizes = {
    content: '16px',
    label: '14px',
}

const shadows = {
    elevated: '0px 9px 28px rgba(0, 0, 0, 0.05), 0px 6px 16px rgba(0, 0, 0, 0.08), 0px 3px 6px rgba(0, 0, 0, 0.12)',
    main: '0px 28px 65px rgba(208, 216, 225, 0.24), 0px 6px 15px rgba(208, 216, 225, 0.28), 0px 2px 6px rgba(208, 216, 225, 0.16)',
    big: '0px 14px 34px rgba(208, 216, 225, 0.4), 0px 15px 38px rgba(208, 216, 225, 0.4), 0px 7px 17px rgba(208, 216, 225, 0.6)',
}

const transitions = {
    elevateTransition: 'box-shadow 0.2s ease-in-out, border 0.2s ease-in-out',
    easeInOut: 'all .2s ease-in-out',
    allDefault: 'all 0.3s',
}

const gradients = {
    onboardingIconGradient: 'linear-gradient(120deg, #00F260, #0575E6, #00F260)',
    sberActionGradient: 'linear-gradient(115deg, #4CD174 16%, #6DB8F2 84%)',
    sberActionInversed: 'linear-gradient(115deg, #3DCB68 16%, #58A6E2 84%)',
    fadeOutGradient: 'linear-gradient(180deg, #FFFFFF 21.92%,rgba(255,255,255,0) 106.02%)',
    mainGradientPressed: 'linear-gradient(115deg, #2ABB56 16%, #3A97DC 84%);',
}

const zIndex = {
    mobileSidenav: 100,
}

const DEFAULT_BORDER_WIDTH = '2px'
const DEFAULT_BORDER_RADIUS = '12px'
const DEFAULT_STRONG_TEXT_FONT_WEIGHT = 600

// Possible customizations can be found at https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
const antGlobalVariables = {
    '@border-radius-base': '8px',
    '@card-radius': '12px',
    '@white': white,
    '@black': black,
    '@heading-color': black,
    '@form-item-label-height': '22px',
    '@label-color': grey[2],
    '@input-border-color': inputBorderGrey,
    '@input-bg': whiteTranslucent,
    '@input-hover-border-color': inputBorderHover,
    '@input-height-base': '48px',
    '@input-height-lg': '48px',
    '@btn-height-lg': '48px',
    '@btn-padding-horizontal-lg': '20px',
    '@input-disabled-bg': whiteTranslucent,
    '@select-background': whiteTranslucent,
    '@select-clear-background': whiteTranslucent,
    '@select-single-item-height-lg': '48px',
    '@select-single-item-height-md': '40px',
    '@select-border-color': inputBorderGrey,
    '@outline-color': inputBorderHover,
    '@outline-fade:': 0,
    '@outline-width': '1px',
    '@checkbox-color': sberGreen,
    '@checkbox-check-bg': ultraLightGrey,
    '@checkbox-border-width': DEFAULT_BORDER_WIDTH,
    '@form-item-margin-bottom': '0',
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
    '@typography-title-margin-bottom': 0,
    '@tooltip-bg': 'rgba(0, 0, 0)',
    '@text-color': colors.sberGrey[9],
    '@text-color-secondary': textSecondary,
    '@success-color': green[6],
    '@warning-color': colors.orange[6],
    '@error-color': colors.red[5],
    '@disabled-color': inputBorderGrey,
    '@link-color': green[6],
    '@link-hover-color': green[8],
    '@link-active-color': colors.sberPrimary[6],
}

const ELLIPSIS_ROWS = 3

module.exports = {
    zIndex,
    colors,
    gradients,
    antGlobalVariables,
    shadows,
    transitions,
    CHART_COLOR_SET,
    UNIT_TYPE_COLOR_SET,
    DEFAULT_BORDER_WIDTH,
    DEFAULT_STRONG_TEXT_FONT_WEIGHT,
    DEFAULT_BORDER_RADIUS,
    fontSizes,
    ELLIPSIS_ROWS,
}
