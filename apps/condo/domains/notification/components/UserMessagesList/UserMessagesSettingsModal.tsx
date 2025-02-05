import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Checkbox, Modal, Space } from '@open-condo/ui'

import { useUserMessagesListSettingsStorage } from '@condo/domains/notification/hooks/useUserMessagesListSettingsStorage'
import { USER_MESSAGE_TYPES_FILTER_ON_CLIENT } from '@condo/domains/notification/utils/client/constants'


export const UserMessagesSettingsModal = ({ open, setOpen, setMessageTypesToFilter }) => {
    const intl = useIntl()
    const ModalTitleMessage = intl.formatMessage({ id: 'notification.UserMessagesSettingModal.title' })
    const ApplyChanges = intl.formatMessage({ id: 'ApplyChanges' })

    const [selectedMessageTypes, setSelectedMessageTypes] = useState([])

    const { organization } = useOrganization()
    const organizationId = useMemo(() => organization?.id, [organization?.id])
    const { userMessagesSettingsStorage } = useUserMessagesListSettingsStorage()

    useEffect(() => {
        const excludedTypesForOrg = userMessagesSettingsStorage.getExcludedUserMessagesTypes()
        const initialSelectedTypes = USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(
            type => !excludedTypesForOrg.includes(type)
        )
        setSelectedMessageTypes(initialSelectedTypes)
    }, [organizationId, userMessagesSettingsStorage])

    const handleCheckboxChange = useCallback((type) => {
        setSelectedMessageTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        )
    }, [])

    const handleSubmit = useCallback(() => {
        const excludedTypes = USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(
            type => !selectedMessageTypes.includes(type)
        )

        userMessagesSettingsStorage.setExcludedUserMessagesTypes(excludedTypes)
        setMessageTypesToFilter(excludedTypes)

        setOpen(false)
    }, [userMessagesSettingsStorage, setMessageTypesToFilter, setOpen, selectedMessageTypes])

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