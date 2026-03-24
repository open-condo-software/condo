import { z } from 'zod'

export const BannerConfigSchema = z.object({
    title: z.string(),
    description: z.string(),
    backgroundColor: z.string(),
    imageUrl: z.string().optional(),
})

export const FeatureItemSchema = z.object({
    key: z.string(),
    iconUrl: z.string(),
    title: z.string(),
    description: z.string(),
})

export const SubscriptionFeatureModalConfigSchema = z.object({
    banner: BannerConfigSchema,
    features: z.array(FeatureItemSchema),
})

export type SubscriptionFeatureModalConfig = z.infer<typeof SubscriptionFeatureModalConfigSchema>

export function safeValidateSubscriptionFeatureModalConfig (data: unknown): SubscriptionFeatureModalConfig | null {
    const result = SubscriptionFeatureModalConfigSchema.safeParse(data)
    return result.success ? result.data : null
}
