const { generate, grey, green  } = require('@ant-design/colors')

const sberBlue = '#5EB1FC'
const sberGreen = '#4CD174'
const white = '#fff'
const lightGrey = '#D9D9D9'
const ultraLightGrey = '#F0F0F0F0'
const black = '#000'
const beautifulBlue = '#eFF7FF'

const colors = {
    sberDefault: generate(sberBlue),
    sberPrimary: generate(sberGreen),
    defaultWhite: generate(white),
    lightGrey: generate(lightGrey),
    beautifulBlue: generate(beautifulBlue),
    white,
    black,
}

// Possible customizations can be found at https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
const antGlobalVariables = {
    '@border-radius-base': '4px',
    '@white': white,
    '@black': black,
    // TOOD(Dimitreee):find cleanest solution to override default large form styles without !important 22px !important
    '@form-item-label-height': '@input-height-base',
    '@label-color': grey[2],
    '@input-border-color': ultraLightGrey,
    '@input-bg': ultraLightGrey,
    '@input-hover-border-color': sberGreen,
    '@select-background': ultraLightGrey,
    '@select-clear-background': ultraLightGrey,
    '@select-border-color': ultraLightGrey,
    '@outline-color': sberGreen,
    '@outline-fade:': 0,
    '@outline-width': '1px',
    '@checkbox-color': sberGreen,
    '@checkbox-check-bg': ultraLightGrey,
    '@form-item-margin-bottom': '0',
    '@success-color': green[6],
    '@table-border-color': colors.lightGrey[5],
    '@table-header-bg': ultraLightGrey,
}

module.exports = {
    colors,
    antGlobalVariables,
}
