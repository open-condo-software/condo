import React, { useMemo } from 'react'
import { useIntl, FormattedMessage } from 'react-intl'

import { QuestionCircle } from '@open-condo/icons'
import { Typography, Space, Tooltip } from '@open-condo/ui'

import styles from './PermissionText.module.css'

import type { MessagesKeysType } from '@/global'

type PermissionTextProps = {
    permission: string
}

function _capitalize (str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function _messageExists (messages: Record<string, unknown>,  key: string): key is MessagesKeysType {
    return messages.hasOwnProperty(key)
}

export const PermissionText: React.FC<PermissionTextProps> = ({ permission }) => {
    const intl = useIntl()
    const messages = useMemo(() => intl.messages, [intl.messages])

    const permissionText = useMemo(() => {
        const translationKey = `pages.apps.any.id.sections.permissions.permission.${permission}.title`
        if (_messageExists(messages, translationKey)) {
            return <FormattedMessage id={translationKey}/>
        }

        return _capitalize(permission)
    }, [messages, permission])

    const hintText = useMemo(() => {
        const translationKey = `pages.apps.any.id.sections.permissions.permission.${permission}.hint`
        if (_messageExists(messages, translationKey)) {
            return <FormattedMessage id={translationKey}/>
        }

        return null
    }, [messages, permission])

    return (
        <Typography.Text size='medium'>
            <Space size={4} direction='horizontal' wrap>
                <span>{permissionText}</span>
                {hintText && (
                    <Tooltip title={hintText}>
                        <span className={styles.hintIcon}>
                            <QuestionCircle size='small'/>
                        </span>
                    </Tooltip>
                )}
            </Space>
        </Typography.Text>
    )
}