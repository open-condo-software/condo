import { Spin as DefaultSpin } from 'antd'
import React from 'react'

import styles from './Spin.module.css'

import type { SpinProps } from 'antd'

export const Spin: React.FC<Omit<SpinProps, 'className'>> = (props) => {
    return <DefaultSpin {...props} className={styles.spinContainer}/>
}