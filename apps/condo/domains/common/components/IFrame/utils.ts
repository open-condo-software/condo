import {
    NotificationType,
    RequirementType,
    NOTIFICATION_MESSAGE_TYPE,
    REQUIREMENT_MESSAGE_TYPE,
    LOADED_STATUS_MESSAGE_TYPE,
} from '@condo/domains/common/utils/iframe.utils'
import getConfig from 'next/config'

const { publicRuntimeConfig: { serverUrl } } = getConfig()

export const sendMessage = (message: string, messageType: NotificationType): void =>  {
    if (parent) {
        parent.postMessage({
            type: NOTIFICATION_MESSAGE_TYPE,
            notificationType: messageType,
            message,
        }, serverUrl)
    }
}

export const sendRequirementRequest = (requirement: RequirementType): void => {
    if (parent) {
        parent.postMessage({
            type:REQUIREMENT_MESSAGE_TYPE,
            requirement,
        }, serverUrl)
    }
}

export const sendLoadedStatus = (): void => {
    if (parent) {
        parent.postMessage({
            type: LOADED_STATUS_MESSAGE_TYPE,
            status: 'done',
        }, serverUrl)
    }
}