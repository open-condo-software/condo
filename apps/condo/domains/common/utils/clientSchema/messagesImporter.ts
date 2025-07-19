export async function messagesImporter (locale: string) {
    const localeData = await import(`@app/condo/lang/${locale}/${locale}`)

    const customLocaleData = await import(`@app/condo/lang/${locale}/${locale}.custom`)
    if (customLocaleData) {
        return { ...localeData.default, ...customLocaleData.default }
    }

    return localeData.default
}
