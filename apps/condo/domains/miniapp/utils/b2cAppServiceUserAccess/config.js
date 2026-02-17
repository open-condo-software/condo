const B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS = {
    lists: {},
    services: {
        // sendVoIPStartPushMessage: {}, // NOTE(YEgorLu): to be made in DOMA-12905
        // sendVoIPCancelPushMessage: {}, // NOTE(YEgorLu): to be made in DOMA-12906
    },
    noRightSetRequired: {
        lists: {
            B2CAppAccessRightSet: {},
            B2CAppProperty: {},
        },
    },
}

module.exports = {
    B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS,
}