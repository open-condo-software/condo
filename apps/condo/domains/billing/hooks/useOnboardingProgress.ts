import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { UUID_REGEXP } from '@condo/domains/common/constants/regexps'

export function useOnboardingProgress (withVerification?: boolean, totalStepsOverride?: number): [number, string] {
    const totalSteps = totalStepsOverride ?? (withVerification ? 4 : 3)
    const allowedSteps = useMemo(() => {
        return Array.from({ length: totalSteps }).map((_, idx) => `${idx}`)
    }, [totalSteps])
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [currentBilling, setCurrentBilling] = useState<string>(null)

    useDeepCompareEffect(()=> {
        const { step, billing } = router.query

        if (!Array.isArray(step) && allowedSteps.includes(step)) {
            setCurrentStep(parseInt(step))
        } else {
            setCurrentStep(0)
        }


        if (!Array.isArray(billing) && UUID_REGEXP.test(billing)) {
            setCurrentBilling(billing)
        } else {
            setCurrentBilling(null)
        }

    }, [allowedSteps, router.query])

    return [currentStep, currentBilling]
}
