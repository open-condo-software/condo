const { plugin } = require('@open-condo/keystone/plugins/utils/typing')

const modeled = ({ validator, validateFields, validateFilters }) => plugin(({ fields = {}, ...rest }) => {
    const hasAvailableModels = Boolean(validator && validator.models.length > 0)

    // WebhookSubscription is intended for model-based webhooks only, so in the normal case
    // `model` must be a required Select backed by models registered through `webHooked()`.
    // Some applications import webhook schemas only to use custom `WebhookPayload` events and
    // therefore never register any `webHooked()` models. In that case `validator.models` stays
    // empty, and a required Select with no options makes the schema impossible to use and can
    // break app startup. To keep such apps bootable while still requiring callers to provide a
    // `model` value, we degrade the field to required Text and skip model-based validation when
    // no models are available.
    //
    // If `validator.models` later becomes non-empty for the same app, the field automatically
    // switches back to the strict Select variant on the next startup because this plugin runs
    // during schema registration, after `webHooked()` had a chance to register models. No special
    // runtime toggle is needed, but existing WebhookSubscription records should be checked before
    // that rollout: rows with arbitrary `model` values are acceptable in the "no models available"
    // mode, while the Select mode expects values from the registered model list. If the storage
    // representation or generated schema changes are important for deployment, run the usual
    // `makemigrations` / schema generation checks as part of that transition.
    fields.model = hasAvailableModels
        ? {
            schemaDoc: 'The data model (schema) that the webhook is subscribed to',
            type: 'Select',
            dataType: 'string',
            isRequired: true,
            options: validator.models,
            hooks: {
                validateInput: (args) => {
                    validateFields(args)
                    validateFilters(args)
                },
            },
        }
        : {
            schemaDoc: 'The data model (schema) that the webhook is subscribed to',
            type: 'Text',
            isRequired: true,
        }

    return { fields, ...rest }
})

module.exports = {
    modeled,
}
