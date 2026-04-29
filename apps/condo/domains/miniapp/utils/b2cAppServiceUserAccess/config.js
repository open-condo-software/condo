/** @example {
 *  lists: {
 *      B2CAppProperty: {
 *          pathToB2CAppId: ['app', 'id'], // if B2CApp.id is stored just as scalar directly in schema, then we can't read the list
 *          rightSetRequired: false, // default is "true", if "true", then migration is made, or else all service users can / can't work with their items 
 *      },
 *  },
 *  services: {
 *      SomeService: {
 *          pathToAddressKey: ['account', 'addressKey'],
 *          pathToB2CAppId: ['b2cAppId'],
 *      }
 *   }
 * } */
const B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS = {
    // Something that has direct path for service user (caller)
    lists: {
        B2CAppAccessRightSet: {
            rightSetRequired: false,
            canBeManaged: false,
        },
        B2CAppProperty: {
            rightSetRequired: false,
        },
    },
    // Something that has B2CApp info and addressKey
    services: {
        sendVoIPCallStartMessage: {},
        // sendVoIPCancelPushMessage: {}, // NOTE(YEgorLu): to be made in DOMA-12906
    },
}

module.exports = {
    B2C_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS,
}