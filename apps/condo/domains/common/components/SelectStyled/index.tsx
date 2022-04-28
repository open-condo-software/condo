/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Select, SelectProps } from 'antd'
import React from 'react'
import { colors } from '../../constants/style'
export type VT = any

interface ISelectProps extends SelectProps<VT> {
    raisedClearButton?: boolean;
}

const style = css`
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



export const SelectStyled: React.FC<ISelectProps> = (props) => {
    const { 
        raisedClearButton, 
        ...otherSelectProps 
    } = props

    return (
        <>
            {(raisedClearButton) ?
                <Select css={ [borderedClrBtnStyle, raisedClrBtnStyle, style] } {...otherSelectProps} /> :
                <Select css={ [style, borderedClrBtnStyle] } {...otherSelectProps} />}
        </>

    )
}