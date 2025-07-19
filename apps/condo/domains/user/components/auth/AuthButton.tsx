import React from 'react'

import { Button, ButtonProps } from '@open-condo/ui'

import styles from './AuthButton.module.css'

const AuthButton: React.FC<ButtonProps> = (props) => {
    return <Button {...props} className={styles.authButton} />
}

export { AuthButton }
