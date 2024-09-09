import en from '@app/{{name}}/lang/en/en.json'
import ru from '@app/{{name}}/lang/ru/ru.json'


// NOTE: Combine all keys together
const translations = [
    en, ru,
]

export type MessagesKeysType = keyof typeof translations[number]

// NOTE: Override global interface allows us to use autocomplete in intl
declare global {
    namespace FormatjsIntl {
        interface Message {
            ids: MessagesKeysType
        }
    }
}