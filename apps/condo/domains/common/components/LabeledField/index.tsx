import React from 'react'

import { QuestionCircle } from '@open-condo/icons'
import { Space, Tooltip } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import styles from './styles.module.css'


type LabeledFieldProps = {
    key?: string
    hint?: string
}

export const LabeledField: React.FC<React.PropsWithChildren<LabeledFieldProps>> = ({
    key,
    hint,
    children,
}) => {
    return (
        <label key={key}>
            <Space size={4}>
                {children}
                {
                    hint && (
                        <Tooltip title={hint}>
                            <div className={styles.iconWrapper}>
                                <QuestionCircle color={colors.gray[7]} size='small' />
                            </div>
                        </Tooltip>
                    )
                }
            </Space>
        </label>
    )
}
