import dayjs from 'dayjs'

export const isExpired = (subscription) => {
    const now = dayjs()
    const finishAt = dayjs(subscription.finishAt)
    return now.isAfter(finishAt)
}
