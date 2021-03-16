const { generate } = require('@ant-design/colors')

const sberBlue = '#5EB1FC'
const sberGreen = '#4CD174'
const white = '#fff'
const grey = '#D9D9D9'
const black = '#000'

const colors = {
    sberDefault: generate(sberBlue),
    sberPrimary: generate(sberGreen),
    defaultWhite: generate(white),
    lightGrey: generate(grey),
    white,
    black,
}

const antGlobalVariables = {
    '@border-radius-base': '4px',
    '@white': white,
    '@black': black,
}

module.exports = {
    colors,
    antGlobalVariables,
}
