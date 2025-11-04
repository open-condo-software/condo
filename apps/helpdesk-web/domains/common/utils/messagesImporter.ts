import { messagesImporter as condoMessagesImporter } from '@condo/domains/common/utils/clientSchema/messagesImporter'

export async function messagesImporter (locale: string) {
    const condoMessages = await condoMessagesImporter(locale)
    const helpdeskMessages = await import(`@app/helpdesk-web/lang/${locale}/${locale}`)

    return {
        ...condoMessages,
        ...helpdeskMessages.default,
    }
}
