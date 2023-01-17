import { notification } from 'antd'
import type { RequestHandler } from './types'

export const handleNotification: RequestHandler<'CondoWebAppShowNotification'> = (params) => {
    const { type, ...restParams } = params
    notification[type](restParams)
    return { success: true }
}