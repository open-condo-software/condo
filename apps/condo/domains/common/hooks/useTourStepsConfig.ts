import { useMemo } from 'react'
import { z } from 'zod'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { CUSTOM_TOUR_STEPS } from '@condo/domains/common/constants/featureflags'


const TourStepsSchema = z.record(
    z.string(),
    z.object({ title: z.string(), message: z.string() })
)

export type TourStepConfig = z.infer<typeof TourStepsSchema>[string]
export type TourStepsConfig = z.infer<typeof TourStepsSchema>

export function useTourStepsConfig (): TourStepsConfig {
    const { useFlagValue } = useFeatureFlags()
    const raw = useFlagValue<unknown>(CUSTOM_TOUR_STEPS)

    return useMemo(() => {
        const result = TourStepsSchema.safeParse(raw)
        return result.success ? result.data : {}
    }, [raw])
}
