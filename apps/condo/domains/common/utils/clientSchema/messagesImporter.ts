export async function messagesImporter (locale: string) {
    const localeData = await import(`@app/condo/lang/${locale}/${locale}`)
    const pagesData = await import (`@app/condo/lang/${locale}/${locale}.pages`)
    return { ...localeData.default, ...pagesData.default }
}
