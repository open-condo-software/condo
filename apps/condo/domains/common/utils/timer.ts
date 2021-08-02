// refs to: https://www.w3schools.com/howto/howto_js_countdown.asp
interface ITimerArguments {
    onUpdate: (progress: number) => void
    onStart?: (startDate: Date) => void
    onFinish?: () => void
    duration: number // s
    step?: number // ms
}

export const timer = (args: ITimerArguments) => {
    const { onStart, onUpdate, onFinish, duration, step = 1000 } = args

    const nextDate = new Date()
    nextDate.setSeconds(nextDate.getSeconds() + duration)

    if (onStart) {
        onStart(nextDate)
    }

    const countDownDate = new Date(nextDate).getTime()

    const update = setInterval(() => {
        const now = new Date().getTime()
        const distance = countDownDate - now

        onUpdate(Math.ceil((distance % (1000 * 60)) / 1000))

        if (distance < 0) {
            clearInterval(update)
            if (onFinish) {
                onFinish()
            }
        }
    }, step)
}
