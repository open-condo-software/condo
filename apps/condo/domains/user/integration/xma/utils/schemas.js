const { z } = require('zod')

const XmaMiniAppInitParamsUserSchema = z.object({
    first_name: z.string().optional(),
    id: z.number(),
    last_name: z.string().optional(),
    language_code: z.string().optional(),
    username: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
}).strict()

const XmaMiniAppInitParamsSchema = z.object({
    auth_date: z.string().regex(/^\d+$/),
    can_send_after: z.number().optional(),
    chat: z.string().optional(),
    chat_type: z.enum(['sender', 'private', 'group', 'supergroup', 'channel']).optional(),
    chat_instance: z.string().optional(),
    hash: z.string(),
    query_id: z.union([z.string(), z.number()]).optional(),
    receiver: XmaMiniAppInitParamsUserSchema.optional(),
    start_param: z.string().optional(),
    user: z.string(),
}).loose()

module.exports = {
    XmaMiniAppInitParamsSchema,
    XmaMiniAppInitParamsUserSchema,
}
