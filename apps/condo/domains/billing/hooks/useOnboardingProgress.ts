import { useRouter } from 'next/router'
import { useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { UUID_REGEXP } from '@condo/domains/common/constants/regexps'

export function useOnboardingProgress (withVerification?: boolean): [number, string] {
    const totalSteps = withVerification ? 4 : 3
    const allowedSteps = Array.from({ length: totalSteps }).map((_, idx) => `${idx}`)
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

    }, [router.query])

    return [currentStep, currentBilling]
}