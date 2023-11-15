import dayjs from 'dayjs'

/**
 *
 * @param deadline Date in ISO format
 * @param isDefault return default type
 * @param startWithDate Date in ISO format
 */
export const getTimeLeftMessageType: (props: {
    deadline?: string,
    isDefault?: boolean
    startWithDate?: string,
}) => 'warning' | 'danger' | null = ({ deadline, isDefault, startWithDate }) => {
    if (isDefault) return null
    const startWith = startWithDate ? dayjs(startWithDate) : dayjs()
    const timeLeft = deadline && dayjs.duration(dayjs(deadline).diff(startWith))
    if (timeLeft && timeLeft.asMilliseconds() < 0) return 'danger'
    if (timeLeft && timeLeft.asHours() < 24) return 'warning'
    return null
}

/**
 *
 * @param show
 * @param type 'warning' or 'danger'
 * @param deadline Date in ISO format
 * @param startWithDate Date in ISO format
 */
export const getTimeLeftMessage: (props: {
    show: boolean,
    deadline?: string,
    startWithDate?: string
    TimeLeftMessage: string
    OverdueMessage: string
}) => string = ({ show, deadline, startWithDate, TimeLeftMessage, OverdueMessage }) => {
    if (!show || !deadline) return null

    const startWith = startWithDate ? dayjs(startWithDate) : dayjs()
    const timeLeft = deadline && dayjs.duration(dayjs(deadline).diff(startWith))
    if (timeLeft && timeLeft.asMilliseconds() < 0) {
        return OverdueMessage
    }
    if (timeLeft && timeLeft.asHours() < 24) {
        return `${TimeLeftMessage} ${timeLeft.format('HH:mm')}`
    }
    return null
}

export const getObjectCreatedMessage = (intl, object) => {
    if (!object) {
        return
    }

    const dt = dayjs(object.createdAt)
    if (!dt.isValid()) return

    const formattedDate = intl.formatDate(dt.valueOf(), {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    return `${intl.formatMessage({ id: 'CreatedDate' })} ${formattedDate}`
}
