export async function messagesImporter (locale: string) {
    const load = async (loc: string) => {
        switch (loc) {
            case 'ru':
                return {
                    ...(await import('@app/condo/lang/ru/ru.json')).default,
                    ...(await import('@app/condo/lang/ru/ru.custom.json')).default,
                }
            case 'es':
                return {
                    ...(await import('@app/condo/lang/es/es.json')).default,
                    ...(await import('@app/condo/lang/es/es.custom.json')).default,
                }
            case 'tr':
                return {
                    ...(await import('@app/condo/lang/tr/tr.json')).default,
                    ...(await import('@app/condo/lang/tr/tr.custom.json')).default,
                }
            default:
                return {
                    ...(await import('@app/condo/lang/en/en.json')).default,
                    ...(await import('@app/condo/lang/en/en.custom.json')).default,
                }
        }
    }

    return load(locale).catch(() => load('en'))
}
