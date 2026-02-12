const DADATA_PROVIDER = 'dadata'
const GOOGLE_PROVIDER = 'google'
const YANDEX_PROVIDER = 'yandex'
const PULLENTI_PROVIDER = 'pullenti'

const INJECTIONS_PROVIDER = 'injections'

/**
 * Providers that support FIAS (Federal Information Address System) IDs
 * These providers return house_fias_id in their response data (normalized data)
 */
const FIAS_PROVIDERS = [DADATA_PROVIDER, PULLENTI_PROVIDER]

const PROVIDERS = [DADATA_PROVIDER, GOOGLE_PROVIDER, YANDEX_PROVIDER, PULLENTI_PROVIDER, INJECTIONS_PROVIDER]

module.exports = {
    DADATA_PROVIDER,
    GOOGLE_PROVIDER,
    YANDEX_PROVIDER,
    PULLENTI_PROVIDER,

    INJECTIONS_PROVIDER,

    FIAS_PROVIDERS,
    PROVIDERS,
}
