/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Select, SelectProps } from 'antd'
import { useApplySelectStyledCss } from './useApplySelectStyledCss'
export type VT = any

interface ISelectProps extends SelectProps<VT> {
    raisedClearButton?: boolean;
    applyGreyStyleCss?: boolean;
}

export const SelectStyled: React.FC<ISelectProps> = (props) => {

    const { 
        applyGreyStyleCss,
        raisedClearButton, 
        ...otherSelectProps 
    } = props

    const  style = useApplySelectStyledCss(applyGreyStyleCss, raisedClearButton)

    return (<Select css={ style } {...otherSelectProps} />)
}
