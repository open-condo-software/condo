export type ShowNotificationParams = {
    type: 'info' | 'warning' | 'error' | 'success'
    message: string
    description?: string
}

export type ShowNotificationData = {
    success: boolean
}