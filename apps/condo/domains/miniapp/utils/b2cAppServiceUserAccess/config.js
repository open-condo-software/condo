/** @example {
 *  lists: {
 *      B2CAppProperty: {
 *          pathToB2CApp: ['app', 'id'],
 *      },
 *  },
 *  services: {
 *      SomeService: {
 *          pathToAddressKey: ['account', 'addressKey'],
 *          pathToB2CApp: ['account', 'address'],
 *      }
 *   }
 * } */
const B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS = {
    // Something that has direct path for service user (caller)
    lists: {
        B2CAppAccessRightSet: {
            isStatic: true,
            canManage: false,
        },
        B2CAppProperty: {
            isStatic: true,
        },
    },
    // Something that has B2CApp info and addressKey
    services: {
        // sendVoIPStartPushMessage: {}, // NOTE(YEgorLu): to be made in DOMA-12905
        // sendVoIPCancelPushMessage: {}, // NOTE(YEgorLu): to be made in DOMA-12906
    },
}

module.exports = {
    B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS,
}