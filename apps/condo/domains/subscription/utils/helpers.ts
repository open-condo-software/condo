import { ServiceSubscription } from '@app/condo/schema'
import dayjs from 'dayjs'

export const isExpired = (subscription: Pick<ServiceSubscription, 'finishAt'>): boolean => {
    const now = dayjs()
    const finishAt = dayjs(subscription.finishAt)
    return now.isAfter(finishAt)
}