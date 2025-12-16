import { 
    useGetNotificationUserSettingsQuery,
    useCreateNotificationUserSettingMutation,
    useUpdateNotificationUserSettingMutation,
} from '@app/condo/gql'
import { MessageType, NotificationUserSettingMessageTransportType } from '@app/condo/schema'
import debounce from 'lodash/debounce'
import { useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import { MessageTypeAllowedToFilterType, USER_MESSAGE_TYPES_FILTER_ON_CLIENT } from '@condo/domains/notification/utils/client/constants'


type StorageDataType = {
    readMessagesAt: {
        [userId: string]: {
            [organizationId: string]: string
        }
    }
    isNotificationSoundEnabled: {
        [userId: string]: boolean
    }
}

const DEFAULT_VALUE: StorageDataType = { readMessagesAt: {}, isNotificationSoundEnabled: {} }

type NotificationUserSettingType = {
    id: string
    user?: { id: string } | null
    messageType?: MessageType | null
    messageTransport?: NotificationUserSettingMessageTransportType | null
    isEnabled?: boolean | null
}

class UserMessagesListSettingsStorage {
    private readonly userId: string
    private readonly organizationId: string
    private readonly storageKey = 'userMessagesListSettingsStorage'
    private readonly storage = new LocalStorageManager<StorageDataType>()
    private settings: Array<NotificationUserSettingType>
    private createSetting: (messageType: MessageTypeAllowedToFilterType, isEnabled: boolean) => Promise<void>
    private updateSetting: (id: string, isEnabled: boolean) => Promise<void>
    private debouncedSave: Map<MessageTypeAllowedToFilterType, ReturnType<typeof debounce>>

    constructor (
        userId: string,
        organizationId: string,
        settings: Array<NotificationUserSettingType>,
        createSetting: (messageType: MessageTypeAllowedToFilterType, isEnabled: boolean) => Promise<void>,
        updateSetting: (id: string, isEnabled: boolean) => Promise<void>
    ) {
        this.userId = userId
        this.organizationId = organizationId
        this.settings = settings || []
        this.createSetting = createSetting
        this.updateSetting = updateSetting
        this.debouncedSave = new Map()
    }

    getStorageKey (): string {
        return this.storageKey
    }

    getExcludedUserMessagesTypes (): Array<MessageTypeAllowedToFilterType> {
        if (!this.userId || !this.organizationId) return []

        const userSettings = this.settings.filter(s => s.user?.id === this.userId)
        const defaultSettings = this.settings.filter(s => !s.user)
        const settingsMap = new Map<MessageTypeAllowedToFilterType, boolean>()
        
        defaultSettings.forEach(setting => {
            const messageType = setting.messageType
            if (messageType && (USER_MESSAGE_TYPES_FILTER_ON_CLIENT as readonly MessageType[]).includes(messageType)) {
                settingsMap.set(messageType as MessageTypeAllowedToFilterType, setting.isEnabled ?? true)
            }
        })
        
        userSettings.forEach(setting => {
            const messageType = setting.messageType
            if (messageType && (USER_MESSAGE_TYPES_FILTER_ON_CLIENT as readonly MessageType[]).includes(messageType)) {
                settingsMap.set(messageType as MessageTypeAllowedToFilterType, setting.isEnabled ?? true)
            }
        })

        return Array.from(settingsMap.entries())
            .filter(([_, isEnabled]) => !isEnabled)
            .map(([messageType]) => messageType)
    }

    setExcludedUserMessagesTypes (messageTypes: Array<MessageTypeAllowedToFilterType>): void {
        if (!this.userId || !this.organizationId) return

        const currentExcluded = this.getExcludedUserMessagesTypes()
        const allMessageTypes = USER_MESSAGE_TYPES_FILTER_ON_CLIENT as readonly MessageTypeAllowedToFilterType[]
        
        allMessageTypes.forEach((messageType) => {
            const isEnabled = !messageTypes.includes(messageType)
            const wasEnabled = !currentExcluded.includes(messageType)
            
            if (isEnabled === wasEnabled) return
            
            if (!this.debouncedSave.has(messageType)) {
                this.debouncedSave.set(messageType, debounce(async (enabled: boolean) => {
                    const existingSetting = this.settings.find(
                        s => s.messageType === messageType && s.user?.id === this.userId
                    )

                    if (existingSetting) {
                        if (existingSetting.isEnabled !== enabled) {
                            await this.updateSetting(existingSetting.id, enabled)
                        }
                    } else {
                        await this.createSetting(messageType, enabled)
                    }
                }, 500))
            }
            
            this.debouncedSave.get(messageType)!(isEnabled)
        })
    }

    getReadUserMessagesAt (): string | null {
        if (!this.userId || !this.organizationId) return null

        const data = this.storage.getItem(this.storageKey)
        return data?.readMessagesAt[this.userId]?.[this.organizationId] || null
    }

    setReadUserMessagesAt (datetime: string): void {
        if (!this.userId || !this.organizationId) return

        const data = this.storage.getItem(this.storageKey) ?? DEFAULT_VALUE
        if (!data.readMessagesAt[this.userId]) data.readMessagesAt[this.userId] = {}

        data.readMessagesAt[this.userId][this.organizationId] = datetime
        this.storage.setItem(this.storageKey, data)
    }

    getIsNotificationSoundEnabled (): boolean {
        if (!this.userId) return
        const data = this.storage.getItem(this.storageKey) ?? DEFAULT_VALUE

        return data.isNotificationSoundEnabled?.[this.userId] ?? true
    }

    setIsNotificationSoundEnabled (isEnabled: boolean): void {
        if (!this.userId) return

        const data = this.storage.getItem(this.storageKey) ?? DEFAULT_VALUE
        if (!data.isNotificationSoundEnabled) {
            data.isNotificationSoundEnabled = {}
        }
        data.isNotificationSoundEnabled[this.userId] = isEnabled

        this.storage.setItem(this.storageKey, data)
    }
}


type UseUserMessagesListSettingsStorageReturnType = {
    userMessagesSettingsStorage: UserMessagesListSettingsStorage
    loading: boolean
}
type UseUserMessagesListSettingsStorageType = () => UseUserMessagesListSettingsStorageReturnType

export const useUserMessagesListSettingsStorage: UseUserMessagesListSettingsStorageType = () => {
    const { user, isAuthenticated } = useAuth()
    const { organization } = useOrganization()
    const { persistor } = useCachePersistor()
    const sender = useMemo(() => getClientSideSenderInfo(), [])

    const { data, loading, refetch } = useGetNotificationUserSettingsQuery({
        variables: {
            userId: user?.id,
            types: [...USER_MESSAGE_TYPES_FILTER_ON_CLIENT],
        },
        skip: !persistor || !isAuthenticated,
    })

    const isDataLoading = !data || loading

    const [createNotificationUserSetting] = useCreateNotificationUserSettingMutation()
    const [updateNotificationUserSetting] = useUpdateNotificationUserSettingMutation()

    const userId = user?.id
    const organizationId = organization?.id

    const userMessagesSettingsStorage = useMemo(
        () => {
            const settings = data?.allNotificationUserSettings || []
            
            const createSetting = async (messageType: MessageTypeAllowedToFilterType, isEnabled: boolean) => {
                if (!userId) return
                await createNotificationUserSetting({
                    variables: {
                        userId,
                        messageType,
                        isEnabled,
                        sender,
                    },
                })
                await refetch()
            }

            const updateSetting = async (id: string, isEnabled: boolean) => {
                await updateNotificationUserSetting({
                    variables: {
                        id,
                        isEnabled,
                        sender,
                    },
                })
                await refetch()
            }

            return new UserMessagesListSettingsStorage(userId, organizationId, settings, createSetting, updateSetting)
        },
        [userId, organizationId, data?.allNotificationUserSettings, createNotificationUserSetting, updateNotificationUserSetting, refetch, sender]
    )

    return {
        userMessagesSettingsStorage,
        loading: isDataLoading,
    }
}