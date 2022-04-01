export async function messagesImporter (locale: string) {
    const locale_data = await import(`@app/condo/lang/${locale}/${locale}`)
    return locale_data.default
}
