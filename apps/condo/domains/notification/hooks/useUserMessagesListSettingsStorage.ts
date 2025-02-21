import { useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import { MessageTypeAllowedToFilterType } from '@condo/domains/notification/utils/client/constants'


type StorageDataType = {
    readMessagesAt: {
        [userId: string]: {
            [organizationId: string]: string
        }
    }
    excludedMessages: {
        [userId: string]: {
            [organizationId: string]: Array<MessageTypeAllowedToFilterType>
        }
    }
}

const DEFAULT_VALUE: StorageDataType = { readMessagesAt: {}, excludedMessages: {} }

class UserMessagesListSettingsStorage {
    private readonly userId: string
    private readonly organizationId: string
    private readonly storageKey = 'userMessagesListSettingsStorage'
    private readonly storage = new LocalStorageManager<StorageDataType>()

    constructor (userId: string, organizationId: string) {
        this.userId = userId
        this.organizationId = organizationId
    }

    getStorageKey (): string {
        return this.storageKey
    }

    getExcludedUserMessagesTypes (): Array<MessageTypeAllowedToFilterType> {
        if (!this.userId || !this.organizationId) return []

        const data = this.storage.getItem(this.storageKey)
        return data?.excludedMessages[this.userId]?.[this.organizationId] ?? []
    }

    setExcludedUserMessagesTypes (messageTypes: Array<MessageTypeAllowedToFilterType>): void {
        if (!this.userId || !this.organizationId) return

        const data = this.storage.getItem(this.storageKey) ?? DEFAULT_VALUE
        if (!data.excludedMessages[this.userId]) data.excludedMessages[this.userId] = {}

        data.excludedMessages[this.userId][this.organizationId] = messageTypes
        this.storage.setItem(this.storageKey, data)
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
}


type UseUserMessagesListSettingsStorageReturnType = {
    userMessagesSettingsStorage: UserMessagesListSettingsStorage
}
type UseUserMessagesListSettingsStorageType = () => UseUserMessagesListSettingsStorageReturnType

export const useUserMessagesListSettingsStorage: UseUserMessagesListSettingsStorageType = () => {
    const { user } = useAuth()
    const { organization } = useOrganization()

    const userId = useMemo(() => user?.id, [user?.id])
    const organizationId = useMemo(() => organization?.id, [organization?.id])

    const userMessagesSettingsStorage = useMemo(() => new UserMessagesListSettingsStorage(userId, organizationId), [userId, organizationId])

    return {
        userMessagesSettingsStorage,
    }
}