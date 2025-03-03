const userAccess = require('@open-condo/keystone/access')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')

// NOTE: Static false will remove field from Create/Update inputs, but we need it in serverSchema,
// so we're using false-resolving functions instead
const readonlyField = {
    read: true,
    create: () => false,
    update: () => false,
    delete: false,
}

function _capitalize (input) {
    return `${input.charAt(0).toUpperCase()}${input.slice(1)}`
}

function getConfirmActionFields (protectedField, maxAttempts) {
    return {
        [protectedField]: {
            schemaDoc: `${_capitalize(protectedField)} to be verified`,
            type: 'Text',
            isRequired: true,
            access: readonlyField,
        },
        code: {
            schemaDoc:
                `Confirmation code. Generated inside one of action-creators, such as startConfirm${_capitalize(protectedField)}Action`,
            type: 'Text',
            isRequired: true,
            access: readonlyField,
        },
        isVerified: {
            schemaDoc:
                `Verifies specified ${protectedField}. ` +
                `If the ${protectedField} has been recently verified (before Confirm${_capitalize(protectedField)}Action expired), ` +
                `then knowing the ID of Confirm${_capitalize(protectedField)}Action allows to register the user.`,
            type: 'Checkbox',
            isRequired: true,
            defaultValue: false,
            access: readonlyField,
        },
        expiresAt: {
            schemaDoc:
                'Action expiration time. After the expiration time, ' +
                `it will not be possible to call action-required mutations with the current Confirm${_capitalize(protectedField)}Action.`,
            type: 'DateTimeUtc',
            isRequired: true,
        },
        attempts: {
            schemaDoc:
                'Number of used attempts to enter the code. ' +
                `When ${maxAttempts} attempts are reached, this action becomes invalid.`,
            type: 'Integer',
            isRequired: true,
            defaultValue: 0,
            access: readonlyField,
        },
    }
}

function getConfirmActionModel (protectedField, maxAttempts) {
    return {
        schemaDoc:
            `Internal schema used for user ${protectedField} confirmation. ` +
            'It\'s impossible to work with it via API.',
        fields: getConfirmActionFields(protectedField, maxAttempts),
        plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
        access: {
            // NOTE: needed only to read codes in tests without TEST_FAKE_CLIENT_MODE .env,
            // (and also modify actions to simulate real-life situations like expiration / deletion)
            read: userAccess.userIsAdmin,
            create: false,
            update: userAccess.userIsAdmin,
            delete: false,
            auth: true,
        },
    }
}

module.exports = {
    getConfirmActionModel,
}