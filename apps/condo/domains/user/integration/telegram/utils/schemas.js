const TelegramOauthCallbackSchema = {
    type: 'object',
    required: ['id', 'auth_date', 'hash'],
    properties: {
        id: { type: 'number' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        username: { type: 'string' },
        photo_url: { type: 'string' }, // don't use format 'uri' as we don't need this field at all
        auth_date: { type: 'string', pattern: '^[0-9]+$' },
        hash: { type: 'string' },
    },
    additionalProperties: false,
}

const TelegramMiniAppInitParamsUserSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        added_to_attachment_menu: { type: 'boolean' },
        allows_write_to_pm: { type: 'boolean' },
        is_premium: { type: 'boolean' },
        first_name: { type: 'string' },
        id: { type: 'number' },
        is_bot: { type: 'boolean' },
        last_name: { type: 'string' },
        language_code: { type: 'string' },
        photo_url: { type: 'string' },
        username: { type: 'string' },
    },
    additionalProperties: false,
}
const TelegramMiniAppInitParamsSchema = {
    type: 'object',
    required: ['user', 'auth_date', 'hash'],
    properties: {
        auth_date: { type: 'string', pattern: '^[0-9]+$' },
        can_send_after: { type: 'number' },
        chat: {
            type: 'object',
            required: ['id', 'type', 'title'],
            properties: {
                id: { type: ['string', 'number'] },
                type: {
                    type: 'string',
                    enum: ['group', 'supergroup', 'channel'],
                },
                title: { type: 'string' },
                username: { type: 'string' },
                photo_url: { type: 'string' },
            },
            additionalProperties: true,
        },
        chat_type: {
            type: 'string',
            enum: ['sender', 'private', 'group', 'supergroup', 'channel'],
        },
        chat_instance: { type: 'string' },
        hash: { type: 'string' },
        query_id: { type: ['string', 'number'] },
        receiver: TelegramMiniAppInitParamsUserSchema,
        start_param: { type: 'string' },
        // Note: here lies encodeURIComponent(JSON.stringify(TelegramMiniAppInitParamsUserSchema))
        // it needs to stay like that for signature validation
        user: { type: 'string' },
    },
    additionalProperties: true,
}

module.exports = {
    TelegramOauthCallbackSchema,
    TelegramMiniAppInitParamsSchema,
    TelegramMiniAppInitParamsUserSchema,
}
