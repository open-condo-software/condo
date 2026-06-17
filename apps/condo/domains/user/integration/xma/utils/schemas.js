const XmaMiniAppInitParamsUserSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        first_name: { type: 'string' },
        id: { type: 'number' },
        last_name: { type: 'string' },
        language_code: { type: 'string' },
        username: { type: ['string', 'null'] },
        photo_url: { type: ['string', 'null'] },
    },
    additionalProperties: false,
}

const XmaMiniAppInitParamsSchema = {
    type: 'object',
    required: ['user', 'auth_date', 'hash'],
    properties: {
        auth_date: { type: 'string', pattern: '^[0-9]+$' },
        can_send_after: { type: 'number' },
        chat: { type: 'string' },
        chat_type: {
            type: 'string',
            enum: ['sender', 'private', 'group', 'supergroup', 'channel'],
        },
        chat_instance: { type: 'string' },
        hash: { type: 'string' },
        query_id: { type: ['string', 'number'] },
        receiver: XmaMiniAppInitParamsUserSchema,
        start_param: { type: 'string' },
        user: { type: 'string' },
    },
    additionalProperties: true,
}

module.exports = {
    XmaMiniAppInitParamsSchema,
    XmaMiniAppInitParamsUserSchema,
}
