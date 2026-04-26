import { LOCALES } from '@/domains/common/constants/locales'

import en from '@/lang/en.json'
import ru from '@/lang/ru.json'

export type AvailableLocales = typeof LOCALES[number]
// NOTE: Combine all keys together
export type MessagesKeysType = keyof typeof en | keyof typeof ru
// NOTE: Require all message keys in all languages, so no lint translations needed
export type MessagesType = { [Locale in AvailableLocales]: { [Key in MessagesKeysType]: string } }

// NOTE: Override global interface allows us to use autocomplete in intl
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace FormatjsIntl {
        interface Message {
            ids: MessagesKeysType
        }
    }
}