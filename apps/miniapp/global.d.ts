import enCondo from '@app/condo/lang/en/en.json'
import ruCondo from '@app/condo/lang/ru/ru.json'
import en from '@app/miniapp/lang/en.json'
import ru from '@app/miniapp/lang/ru.json'


// NOTE: Combine all keys together
const translations = [
    en, ru,
]
const translationsCondo = [
    enCondo, ruCondo,
]

export type MessagesKeysType = keyof typeof translations[number] | keyof typeof translationsCondo[number]

// NOTE: Override global interface allows us to use autocomplete in intl
declare global {
    namespace FormatjsIntl {
        interface Message {
            ids: MessagesKeysType
        }
    }
}
