import en from '@/lang/en.json'
import ru from '@/lang/ru.json'

export type MessagesKeysType = keyof typeof ru | keyof typeof en

// NOTE: Override global interface allows us to use autocomplete in intl
declare global {
    namespace FormatjsIntl {
        interface Message {
            ids: MessagesKeysType
        }
    }
}