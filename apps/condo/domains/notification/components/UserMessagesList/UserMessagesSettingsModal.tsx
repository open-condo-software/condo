import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { QuestionCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Switch, Modal, Space, Typography, Tooltip } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { useUserMessagesList } from '@condo/domains/notification/contexts/UserMessagesListContext'
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
    const SoundMessage = intl.formatMessage({ id: 'notification.UserMessagesSettingModal.sound' })
    const SoundEnabledTooltip = intl.formatMessage({ id: 'notification.UserMessagesSettingModal.sound.tooltip.enabled' })
    const SoundDisabledTooltip = intl.formatMessage({ id: 'notification.UserMessagesSettingModal.sound.tooltip.disabled' })

    const { messageTypes } = useAllowedToFilterMessageTypes()
    const { userMessagesSettingsStorage } = useUserMessagesListSettingsStorage()
    const { isNotificationSoundEnabled, setIsNotificationSoundEnabled } = useUserMessagesList()

    const handleSwitchChange = useCallback((checked: boolean, checkedType: MessageTypeAllowedToFilterType) => {
        const newExcludedTypes: Array<MessageTypeAllowedToFilterType> = checked
            ? excludedMessageTypes.filter(type => type !== checkedType)
            : [...excludedMessageTypes, checkedType]

        setExcludedMessageTypes(newExcludedTypes)
        userMessagesSettingsStorage.setExcludedUserMessagesTypes(newExcludedTypes)
    }, [excludedMessageTypes, setExcludedMessageTypes, userMessagesSettingsStorage])

    const handleSubmit = useCallback(() => {
        setOpen(false)
    }, [setOpen])

    const isAllMessageTypesDisabled = useMemo(() => messageTypes.every(type => excludedMessageTypes.includes(type)), [excludedMessageTypes, messageTypes])

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
            <Space size={24} direction='vertical'>
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
                {
                    !isAllMessageTypesDisabled && (
                        <label>
                            <Space size={4}>
                                <Space size={8}>
                                    <Switch
                                        id='notification-sound-switch'
                                        checked={isNotificationSoundEnabled}
                                        onChange={setIsNotificationSoundEnabled}
                                        size='small'
                                    />
                                    <Typography.Text>
                                        {SoundMessage}
                                    </Typography.Text>
                                </Space>
                                <Tooltip
                                    title={isNotificationSoundEnabled ? SoundEnabledTooltip : SoundDisabledTooltip}
                                    placement='topLeft'
                                >
                                    <div style={{ display: 'flex' }}>
                                        <QuestionCircle size='small' color={colors.gray[7]} />
                                    </div>
                                </Tooltip>
                            </Space>
                        </label>
                    )
                }
            </Space>
        </Modal>
    )
}