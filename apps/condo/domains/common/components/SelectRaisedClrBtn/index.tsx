import { Global } from '@emotion/core'
import { Select, SelectProps } from 'antd'
import React from 'react'
import { SelectFixClrBtn } from '../containers/BaseLayout/components/styles'
export type VT = any

interface ISelectProps extends SelectProps<VT> {
    raisedClearButton?: boolean;
}


export const SelectRaisedClrBtn: React.FC<ISelectProps> = ({ raisedClearButton, ...otherSelectProps }) => {



    return (
        <>

            <Global styles={SelectFixClrBtn}/>
            <Select {...otherSelectProps} />
        </>

    )
}