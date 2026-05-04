import { Table } from 'antd'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { CheckCircle, XCircle } from '@open-condo/icons'

import styles from './SupportedPlatforms.module.css'

type AvailablePlatforms = 'B2BWeb' | 'B2CWeb' | 'B2CNative'
type Aliases = 'web'

type SupportedPlatformsProps = {
    platforms: Array<AvailablePlatforms | Aliases>
}

export function SupportedPlatforms ({ platforms }: SupportedPlatformsProps): React.ReactElement {
    const intl = useIntl()

    const resolvedPlatforms: Record<AvailablePlatforms, boolean> = platforms.reduce((acc, platform) => {
        if (platform === 'web') {
            acc.B2BWeb = true
            acc.B2CWeb = true
        } else {
            acc[platform] = true
        }
        return acc
    }, { B2BWeb: false, B2CWeb: false, B2CNative: false } as Record<AvailablePlatforms, boolean>)

    const columns = useMemo(() => [
        {
            title: 'B2B Web',
            dataIndex: 'B2BWeb',
        },
        {
            title: 'B2C Web',
            dataIndex: 'B2CWeb',
        },
        {
            title: 'B2C Cordova',
            dataIndex: 'B2CNative',
        },
    ] as const, [])

    return (
        <table className={styles.table} id='supported-platforms-table'>
            <thead>
                <tr>
                    {columns.map((column) => (
                        <th key={column.dataIndex} className={styles.centerCell}>{column.title}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    {columns.map((column) => (
                        <td key={column.dataIndex} className={styles.centerCell}>
                            {resolvedPlatforms[column.dataIndex]
                                ? <CheckCircle color='var(--condo-global-color-green-5)' />
                                : <XCircle color='var(--condo-global-color-red-5)' />}
                        </td>
                    ))}
                </tr>
            </tbody>
        </table>
    )
}