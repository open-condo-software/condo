import React from 'react'

import styles from './InfoBlock.module.css'


export const InfoBlock: React.FC = ({ children }) => {
    return <div className={styles.infoBlock} children={children} />
}
