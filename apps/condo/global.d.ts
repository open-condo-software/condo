import en from '@app/condo/lang/en/en.json'
import ru from '@app/condo/lang/ru/ru.json'


// NOTE: Combine all keys together
const translations = [en, ru] as const
type MessagesKeysType = keyof typeof translations[number]

// NOTE: Override global interface allows us to use autocomplete in intl
declare global {
    namespace FormatjsIntl {
        interface Message {
            ids: MessagesKeysType
        }
    }
}
