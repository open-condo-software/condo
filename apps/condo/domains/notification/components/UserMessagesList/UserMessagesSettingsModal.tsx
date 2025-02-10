import React, { useCallback, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useIntl } from '@open-condo/next/intl'
import { Button, Checkbox, Modal, Space } from '@open-condo/ui'

import { useUserMessagesListSettingsStorage } from '@condo/domains/notification/hooks/useUserMessagesListSettingsStorage'
import { USER_MESSAGE_TYPES_FILTER_ON_CLIENT } from '@condo/domains/notification/utils/client/constants'


export const UserMessagesSettingsModal = ({ open, setOpen, excludedMessageTypes, setExcludedMessageTypes }) => {
    const intl = useIntl()
    const ModalTitleMessage = intl.formatMessage({ id: 'notification.UserMessagesSettingModal.title' })
    const ApplyChanges = intl.formatMessage({ id: 'ApplyChanges' })

    const [selectedMessageTypes, setSelectedMessageTypes] = useState(
        USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(type => !excludedMessageTypes.includes(type))
    )

    useDeepCompareEffect(() => {
        setSelectedMessageTypes(USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(type => !excludedMessageTypes.includes(type)))
    }, [excludedMessageTypes])

    const handleCheckboxChange = useCallback((checkedType) => {
        setSelectedMessageTypes((oldSelectedTypesState) =>
            oldSelectedTypesState.includes(checkedType)
                ? oldSelectedTypesState.filter(type => type !== checkedType)
                : [...oldSelectedTypesState, checkedType]
        )
    }, [])

    const { userMessagesSettingsStorage } = useUserMessagesListSettingsStorage()

    const handleSubmit = useCallback(() => {
        const newExcludedTypes = USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(
            type => !selectedMessageTypes.includes(type)
        )

        userMessagesSettingsStorage.setExcludedUserMessagesTypes(newExcludedTypes)
        setExcludedMessageTypes(newExcludedTypes)

        setOpen(false)
    }, [userMessagesSettingsStorage, setExcludedMessageTypes, setOpen, selectedMessageTypes])

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
                {USER_MESSAGE_TYPES_FILTER_ON_CLIENT.map((type) => (
                    <Checkbox
                        key={type}
                        label={
                            intl.formatMessage(
                                { id: `notification.UserMessagesSettingModal.messageType.${type}.label` }
                            )
                        }
                        checked={selectedMessageTypes.includes(type)}
                        onChange={() => handleCheckboxChange(type)}
                    />
                ))}
            </Space>
        </Modal>
    )
}