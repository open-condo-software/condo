const { generate, grey } = require('@ant-design/colors')
/*
* 0: "#a6a6a6"
1: "#999999"
2: "#8c8c8c"
3: "#808080"
4: "#737373"
5: "#666666"
6: "#404040"
7: "#1a1a1a"
8: "#000000"
9: "#000000"
primary: "#666666"
*
* */

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

const antGlobalVariables = {
    '@border-radius-base': '4px',
    '@white': white,
    '@black': black,
    // TOOD(Dimitreee):find cleanest solution to override default large form styles without !important
    '@form-item-label-height': '22px !important',
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

}

module.exports = {
    colors,
    antGlobalVariables,
}
