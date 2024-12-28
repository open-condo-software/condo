import React, { useCallback, useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Checkbox, Modal, Space } from '@open-condo/ui'

import {
    USER_MESSAGE_TYPES_FILTER_ON_CLIENT,
    EXCLUDED_USER_MESSAGE_TYPES_LOCAL_STORAGE_KEY,
} from '@condo/domains/notification/components/constants'


export const UserMessagesSettingsModal = ({ open, setOpen, setMessageTypesToFilter }) => {
    const intl = useIntl()
    const ModalTitleMessage = intl.formatMessage({ id: 'notification.UserMessagesSettingModal.title' })
    const ApplyChanges = intl.formatMessage({ id: 'ApplyChanges' })

    const { organization } = useOrganization()
    const organizationId = organization?.id

    const [selectedMessageTypes, setSelectedMessageTypes] = useState([])

    useEffect(() => {
        const storedExcludedTypes = JSON.parse(localStorage.getItem(EXCLUDED_USER_MESSAGE_TYPES_LOCAL_STORAGE_KEY)) || {}
        const excludedTypesForOrg = storedExcludedTypes[organizationId] || []
        const initialSelectedTypes = USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(
            (type) => !excludedTypesForOrg.includes(type)
        )
        setSelectedMessageTypes(initialSelectedTypes)
    }, [organizationId])

    const handleCheckboxChange = (type) => {
        setSelectedMessageTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        )
    }

    const handleSubmit = useCallback(() => {
        const excludedTypes = USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(
            (type) => !selectedMessageTypes.includes(type)
        )

        const storedExcludedTypes = JSON.parse(localStorage.getItem(EXCLUDED_USER_MESSAGE_TYPES_LOCAL_STORAGE_KEY)) || {}
        const updatedExcludedTypes = { ...storedExcludedTypes, [organizationId]: excludedTypes }
        localStorage.setItem(EXCLUDED_USER_MESSAGE_TYPES_LOCAL_STORAGE_KEY, JSON.stringify(updatedExcludedTypes))
        setMessageTypesToFilter(excludedTypes)

        setOpen(false)
    }, [organizationId, setOpen, setMessageTypesToFilter, selectedMessageTypes])

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