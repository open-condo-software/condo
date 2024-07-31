const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')


const SERVICE_NAME = 'sendB2CAppPushMessage'

class NotificationThrottler {
    async constructor(context, type, B2CApp, user, B2CAppMessageSetting) {
        this.windowSize = B2CAppMessageSetting.notificationWindowSize // Временное окно в миллисекундах
        this.maxNotifications = B2CAppMessageSetting.numberOfNotificationInWindow // Максимальное количество нотификаций за окно
        this.searchKey = `${type}_${B2CApp.id}_${user.id}`
        this.notificationTimes = await this.redisGuard.checkLock(`${this.searchKey}_notificationTimes`, SERVICE_NAME, context) || [] // Массив для хранения времени отправки нотификаций
        this.redisGuard = new RedisGuard()
    }

    canSendNotification () {
        const currentTime = Date.now()
        // Удаляем устаревшие нотификации из массива
        this.notificationTimes = this.notificationTimes.filter(time => time > currentTime - this.windowSize)

        // Проверяем, можем ли отправить новую нотификацию
        if (this.notificationTimes.length < this.maxNotifications) {
            return true
        } else {
            return false
        }
    }

    sendNotification () {
        if (this.canSendNotification()) {
            this.notificationTimes.push(Date.now())
            console.log('Notification sent.')
        } else {
            console.log('Notification throttled. Try again later.')
        }
    }
}

// Пример использования
const notificationThrottler = new NotificationThrottler(60000, 5) // Окно в 60 секунд и максимум 5 нотификаций

// Функция для отправки нотификаций с паузой между ними
const sendNotifications = async () => {
    for (let i = 0; i < 7; i++) {
        notificationThrottler.sendNotification()
        await new Promise(resolve => setTimeout(resolve, 10000)) // Пауза в 10 секунд между отправками
    }
}

sendNotifications()