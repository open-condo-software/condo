import { Spin } from 'antd'
import classNames from 'classnames'
import React, { useMemo } from 'react'

import { Paperclip, Trash } from '@open-condo/icons'
import { Button, Typography } from '@open-condo/ui'

import styles from './AIChatDocument.module.css'

export type AIChatDocumentStatus = 'uploading' | 'done' | 'error'

const FILE_NAME_ELLIPSIS = { rows: 1 }

export type AIChatDocumentProps = {
    name: string
    status?: AIChatDocumentStatus
    onRemove?: () => void
    removeDisabled?: boolean
    className?: string
}

export const AIChatDocument: React.FC<AIChatDocumentProps> = ({
    name,
    status = 'done',
    onRemove,
    removeDisabled = false,
    className,
}) => {
    const { baseName, ext } = useMemo(() => {
        const fileNameArr = name.split('.')
        const fileExt = fileNameArr.length > 1 ? fileNameArr.pop() : undefined

        return {
            baseName: fileNameArr.join('.'),
            ext: fileExt,
        }
    }, [name])
    const showRemove = Boolean(onRemove) && !removeDisabled
    const isError = status === 'error'

    return (
        <div
            className={classNames(styles.root, className, {
                [styles.rootError]: isError,
            })}
        >
            <div className={styles.icon}>
                {status === 'uploading' ? (
                    <Spin size='small' />
                ) : (
                    <Paperclip size='medium' />
                )}
            </div>
            <div className={styles.fileNameRow}>
                <span className={styles.baseName}>
                    <Typography.Paragraph
                        ellipsis={FILE_NAME_ELLIPSIS}
                        size='medium'
                        type={isError ? 'danger' : 'primary'}
                    >
                        {baseName}
                    </Typography.Paragraph>
                </span>
                {ext ? (
                    <span className={styles.extension}>
                        <Typography.Text type='secondary' size='medium'>
                            .{ext}
                        </Typography.Text>
                    </span>
                ) : null}
                {showRemove ? (
                    <Button
                        type='secondary'
                        minimal
                        compact
                        size='medium'
                        className={styles.removeButton}
                        icon={<Trash size='small' />}
                        onClick={onRemove}
                        aria-label='Remove attachment'
                    />
                ) : null}
            </div>
        </div>
    )
}
