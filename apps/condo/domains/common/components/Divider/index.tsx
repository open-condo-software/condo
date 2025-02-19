import { Divider as DefaultDivider, DividerProps } from 'antd'
import React from 'react'

import './styles.css'

export const Divider: React.FC<DividerProps> = (props) => {
    return <DefaultDivider {...props} className='condo-divider' />
}
