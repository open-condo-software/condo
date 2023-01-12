const {
    DADATA_PROVIDER,
    GOOGLE_PROVIDER,
    YANDEX_PROVIDER,
} = require('@address-service/domains/common/constants/providers')

const suggestionContexts = {
    /**
     * The `default` context is using for all calls to providers
     */
    default: {
        [DADATA_PROVIDER]: {
            from_bound: { value: 'country' },
            to_bound: { value: 'house' },
            restrict_value: true,
            count: 20,
        },
        [GOOGLE_PROVIDER]: {},
        [YANDEX_PROVIDER]: {},
    },

    /**
     * The other contexts will be loaded according to the query.
     * The values from the default context will be overridden by values from other ones.
     */
    mobileApp: {
        [DADATA_PROVIDER]: {
            from_bound: { value: 'city' },
            to_bound: { value: 'house' },
        },
        [GOOGLE_PROVIDER]: {},
        [YANDEX_PROVIDER]: {},
    },
    suggestHouse: {
        [DADATA_PROVIDER]: {
            from_bound: { value: 'house' },
            to_bound: { value: 'house' },
        },
    },
    userRuntime: {
        [DADATA_PROVIDER]: {
            from_bound: { value: 'country' },
        },
        [GOOGLE_PROVIDER]: {},
        [YANDEX_PROVIDER]: {},
    },
    /**
     * @see apps/condo/domains/common/utils/serverSideAddressApi.js
     */
    serverSide: {
        [DADATA_PROVIDER]: {
            // NOTE: Used search from house to house for preventing results for country only etc.
            // Since we don't need such suggestions on server side
            from_bound: { value: 'house' },
            to_bound: { value: 'house' },
            restrict_value: true,
        },
        [GOOGLE_PROVIDER]: {},
        [YANDEX_PROVIDER]: {},
    },
}

const searchContexts = {
    default: {
        [DADATA_PROVIDER]: {},
        [GOOGLE_PROVIDER]: {},
        [YANDEX_PROVIDER]: {},
    },
}

module.exports = { suggestionContexts, searchContexts }
