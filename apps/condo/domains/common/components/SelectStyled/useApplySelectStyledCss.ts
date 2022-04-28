import { css } from '@emotion/core'
import { colors } from '../../constants/style'


export const useApplySelectStyledCss = (applyCss: boolean, raisedClearButton: boolean) => {

    const greyStyle = css`
    &.ant-select:not(.ant-select-customize-input) .ant-select-selector,
    &.ant-select-show-search , 
    &.ant-select:not(.ant-select-customize-input) .ant-select-selector {
        background-color: ${colors.ultraLightGrey};
        border-radius: 8px
    }

    &.ant-select-lg.ant-select-multiple .ant-select-selection-item {
        background-color: ${colors.white};
    }
    `

    const borderedClrBtnStyle = css`
    .ant-select-clear {
        border-radius: 5px
    }
    `

    const raisedClrBtnStyle = css`
    .ant-select-clear {
        top: 30%;
    }
    `
    const style: any = []
    
    if (applyCss){
        style.push(borderedClrBtnStyle, greyStyle)
    }
    if (raisedClearButton) {
        style.push(raisedClrBtnStyle)
    }

    return style
}