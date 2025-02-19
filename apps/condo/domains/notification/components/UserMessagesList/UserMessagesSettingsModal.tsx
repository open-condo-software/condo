import React, { Dispatch, SetStateAction, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Switch, Modal, Space, Typography } from '@open-condo/ui'

import { useAllowedToFilterMessageTypes } from '@condo/domains/notification/hooks/useAllowedToFilterMessageTypes'
import {
    useUserMessagesListSettingsStorage,
} from '@condo/domains/notification/hooks/useUserMessagesListSettingsStorage'
import {
    MessageTypeAllowedToFilterType,
} from '@condo/domains/notification/utils/client/constants'


type UserMessagesSettingsModalProps = {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
    excludedMessageTypes: Array<MessageTypeAllowedToFilterType>
    setExcludedMessageTypes: Dispatch<SetStateAction<Array<MessageTypeAllowedToFilterType>>>
}

export const UserMessagesSettingsModal: React.FC<UserMessagesSettingsModalProps> = ({ open, setOpen, excludedMessageTypes, setExcludedMessageTypes }) => {
    const intl = useIntl()
    const ModalTitleMessage = intl.formatMessage({ id: 'notification.UserMessagesSettingModal.title' })
    const ApplyChanges = intl.formatMessage({ id: 'ApplyChanges' })

    const { messageTypes } = useAllowedToFilterMessageTypes()
    const { userMessagesSettingsStorage } = useUserMessagesListSettingsStorage()

    const handleSwitchChange = useCallback((checked: boolean, checkedType: MessageTypeAllowedToFilterType) => {
        setExcludedMessageTypes((prevExcludedTypes) => {
            const newExcludedTypes: Array<MessageTypeAllowedToFilterType> = checked
                ? prevExcludedTypes.filter(type => type !== checkedType)
                : [...prevExcludedTypes, checkedType]

            userMessagesSettingsStorage.setExcludedUserMessagesTypes(newExcludedTypes)
            return newExcludedTypes
        })
    }, [setExcludedMessageTypes, userMessagesSettingsStorage])

    const handleSubmit = useCallback(() => {
        setOpen(false)
    }, [setOpen])

    return (
        <Modal
            open={open}
            onCancel={() => setOpen(false)}
            title={ModalTitleMessage}
            footer={(
                <Button type='primary' onClick={handleSubmit}>
                    {ApplyChanges}
                </Button>
            )}
        >
            <Space size={12} direction='vertical'>
                {messageTypes.map((type) => (
                    <label key={type}>
                        <Space size={8}>
                            <Switch
                                id={type}
                                checked={!excludedMessageTypes.includes(type)}
                                onChange={(checked) => handleSwitchChange(checked, type)}
                                size='small'
                            />
                            <Typography.Text>
                                {
                                    intl.formatMessage(
                                        { id: `notification.UserMessagesSettingModal.messageType.${type}.label` }
                                    )
                                }
                            </Typography.Text>
                        </Space>
                    </label>
                ))}
            </Space>
        </Modal>
    )
}