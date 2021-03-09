import { generate } from '@ant-design/colors';

const sberBlue = '#5EB1FC'
const sberGreen = '#4CD174'
const white = '#fff'
const black = '#000'

export const colors = {
    sberDefault: generate(sberBlue),
    sberPrimary: generate(sberGreen),
    defaultWhite: generate(white),
    white,
    black,
}

export const antGlobalVariables = {
    '@border-radius-base': '4px',
    '@white': white,
    '@black': black,
}
