/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Select, SelectProps } from 'antd'
import { useApplySelectStyledCss } from './useApplySelectStyledCss'
export type VT = any

interface ISelectProps extends SelectProps<VT> {
    raisedClearButton?: boolean;
    applyCss?: boolean;
}

export const SelectStyled: React.FC<ISelectProps> = (props) => {
    const { 
        applyCss,
        raisedClearButton, 
        ...otherSelectProps 
    } = props

    const  style = useApplySelectStyledCss(applyCss, raisedClearButton)

    return (
        <>
            <Select css={ style } {...otherSelectProps} />
        </>

    )
}