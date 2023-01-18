export type ShowNotificationParams = {
    type: 'info' | 'warning' | 'error' | 'success'
    message: string
    description?: string
}