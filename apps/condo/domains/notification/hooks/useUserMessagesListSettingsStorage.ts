import { MessageType, NotificationUserSettingMessageTransportType } from '@app/condo/schema'
import debounce from 'lodash/debounce'
import { useEffect, useMemo, useRef } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import { MessageTypeAllowedToFilterType, USER_MESSAGE_TYPES_FILTER_ON_CLIENT } from '@condo/domains/notification/utils/client/constants'

import { 
    useGetNotificationUserSettingsQuery,
    useCreateNotificationUserSettingMutation,
    useUpdateNotificationUserSettingMutation,
} from '../../../gql'


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

type MutationCallbacks = {
    createSetting: (messageType: MessageTypeAllowedToFilterType, isEnabled: boolean) => Promise<void>
    updateSetting: (id: string, isEnabled: boolean) => Promise<void>
}

class UserMessagesListSettingsStorage {
    private readonly userId: string
    private readonly organizationId: string
    private readonly storageKey = 'userMessagesListSettingsStorage'
    private readonly storage = new LocalStorageManager<StorageDataType>()
    private settings: Array<NotificationUserSettingType>
    private readonly mutationCallbacks: MutationCallbacks
    private pendingChanges: Map<MessageTypeAllowedToFilterType, boolean> = new Map()
    private debouncedApplyChanges: ReturnType<typeof debounce>

    constructor (
        userId: string,
        organizationId: string,
        settings: Array<NotificationUserSettingType>,
        mutationCallbacks: MutationCallbacks
    ) {
        this.userId = userId
        this.organizationId = organizationId
        this.settings = settings || []
        this.mutationCallbacks = mutationCallbacks
        
        // Debounce the actual mutation execution
        this.debouncedApplyChanges = debounce(async () => {
            await this.applyPendingChanges()
        }, 500)
    }

    updateSettings (settings: Array<NotificationUserSettingType>): void {
        this.settings = settings
    }

    cleanup (): void {
        // Cancel any pending debounced calls
        this.debouncedApplyChanges.cancel()
        this.pendingChanges.clear()
    }

    private async applyPendingChanges (): Promise<void> {
        if (this.pendingChanges.size === 0) return

        const changes = Array.from(this.pendingChanges.entries())
        this.pendingChanges.clear()

        const updates = changes.map(async ([messageType, isEnabled]) => {
            // Find existing user-specific setting
            const existingSetting = this.settings.find(
                s => s.messageType === messageType && s.user?.id === this.userId
            )

            if (existingSetting) {
                // Update existing setting if value changed
                if (existingSetting.isEnabled !== isEnabled) {
                    await this.mutationCallbacks.updateSetting(existingSetting.id, isEnabled)
                }
            } else {
                // Create new user-specific setting
                await this.mutationCallbacks.createSetting(messageType, isEnabled)
            }
        })

        await Promise.all(updates)
    }

    getStorageKey (): string {
        return this.storageKey
    }

    getExcludedUserMessagesTypes (): Array<MessageTypeAllowedToFilterType> {
        if (!this.userId || !this.organizationId) return []

        // Get user-specific settings and default settings (where user is null)
        const userSettings = this.settings.filter(s => s.user?.id === this.userId)
        const defaultSettings = this.settings.filter(s => !s.user)

        // Build a map of messageType -> isEnabled, prioritizing user settings over defaults
        const settingsMap = new Map<MessageTypeAllowedToFilterType, boolean>()
        
        // First, apply default settings
        defaultSettings.forEach(setting => {
            const messageType = setting.messageType
            if (messageType && (USER_MESSAGE_TYPES_FILTER_ON_CLIENT as readonly MessageType[]).includes(messageType)) {
                settingsMap.set(messageType as MessageTypeAllowedToFilterType, setting.isEnabled ?? true)
            }
        })
        
        // Then, override with user-specific settings
        userSettings.forEach(setting => {
            const messageType = setting.messageType
            if (messageType && (USER_MESSAGE_TYPES_FILTER_ON_CLIENT as readonly MessageType[]).includes(messageType)) {
                settingsMap.set(messageType as MessageTypeAllowedToFilterType, setting.isEnabled ?? true)
            }
        })

        // Return message types where isEnabled is false (excluded)
        return Array.from(settingsMap.entries())
            .filter(([_, isEnabled]) => !isEnabled)
            .map(([messageType]) => messageType)
    }

    setExcludedUserMessagesTypes (messageTypes: Array<MessageTypeAllowedToFilterType>): void {
        if (!this.userId || !this.organizationId) return

        // Get current state to detect what actually changed
        const currentExcluded = this.getExcludedUserMessagesTypes()
        const allMessageTypes = USER_MESSAGE_TYPES_FILTER_ON_CLIENT as readonly MessageTypeAllowedToFilterType[]
        
        // Store only changed settings
        allMessageTypes.forEach((messageType) => {
            const isEnabled = !messageTypes.includes(messageType)
            const wasEnabled = !currentExcluded.includes(messageType)
            
            // Only add to pending if value changed
            if (isEnabled !== wasEnabled) {
                this.pendingChanges.set(messageType, isEnabled)
            }
        })

        // Trigger debounced execution only if there are changes
        if (this.pendingChanges.size > 0) {
            this.debouncedApplyChanges()
        }
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
        if (!this.userId) return true
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

    const [createNotificationUserSetting] = useCreateNotificationUserSettingMutation()
    const [updateNotificationUserSetting] = useUpdateNotificationUserSettingMutation()

    const userId = useMemo(() => user?.id, [user?.id])
    const organizationId = useMemo(() => organization?.id, [organization?.id])

    const settings = useMemo(() => {
        return data?.allNotificationUserSettings || []
    }, [data])

    // Store callbacks in ref to keep them fresh without recreating storage
    const mutationCallbacksRef = useRef<MutationCallbacks>({
        createSetting: async () => {},
        updateSetting: async () => {},
    })

    // Update callbacks ref on every render
    mutationCallbacksRef.current = {
        createSetting: async (messageType: MessageTypeAllowedToFilterType, isEnabled: boolean) => {
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
        },
        updateSetting: async (id: string, isEnabled: boolean) => {
            await updateNotificationUserSetting({
                variables: {
                    id,
                    isEnabled,
                    sender,
                },
            })
            await refetch()
        },
    }

    // Stable callbacks object that delegates to ref
    const stableMutationCallbacks = useMemo<MutationCallbacks>(() => ({
        createSetting: async (messageType, isEnabled) => {
            return mutationCallbacksRef.current.createSetting(messageType, isEnabled)
        },
        updateSetting: async (id, isEnabled) => {
            return mutationCallbacksRef.current.updateSetting(id, isEnabled)
        },
    }), [])

    // Create storage instance only once with stable callbacks
    const userMessagesSettingsStorage = useMemo(
        () => new UserMessagesListSettingsStorage(userId, organizationId, settings, stableMutationCallbacks),
        [userId, organizationId, settings, stableMutationCallbacks]
    )

    // Update settings in existing instance when data changes
    useEffect(() => {
        userMessagesSettingsStorage.updateSettings(settings)
    }, [settings, userMessagesSettingsStorage])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            userMessagesSettingsStorage.cleanup()
        }
    }, [userMessagesSettingsStorage])

    return {
        userMessagesSettingsStorage,
        loading,
    }
}