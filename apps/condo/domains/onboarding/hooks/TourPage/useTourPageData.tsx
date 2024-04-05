import { TourStepStatusType } from '@app/condo/schema'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useTourContext } from '@condo/domains/onboarding/contexts/TourContext'
import { GUIDE_LINK } from '@condo/domains/onboarding/utils/clientSchema/constants'


export const useTourPageData = ({ isAllSecondStepsCompleted, isInnerStepsCompleted }) => {
    const intl = useIntl()
    const CompletedTourDescription = intl.formatMessage({ id: 'tour.pageData.default.completed.description' })
    const OpenGuideMessage = intl.formatMessage({ id: 'tour.openGuide' })
    const ChooseOtherTaskMessage = intl.formatMessage({ id: 'tour.chooseOtherTask' })

    const router = useRouter()

    const { activeTourStep, setActiveTourStep } = useTourContext()

    const handleBackClick = useCallback(() => setActiveTourStep(null), [setActiveTourStep])
    const handleOpenGuide = useCallback(() => router.push(GUIDE_LINK), [router])

    const activeStepType = activeTourStep || 'default'
    const isDefaultStep = activeStepType === 'default'
    const innerStepsStatus = useMemo(() => {
        if (isDefaultStep) {
            return isAllSecondStepsCompleted ? TourStepStatusType.Completed : TourStepStatusType.Todo
        }

        return isInnerStepsCompleted ? TourStepStatusType.Completed : TourStepStatusType.Todo
    }, [isAllSecondStepsCompleted, isDefaultStep, isInnerStepsCompleted])

    const title = intl.formatMessage({ id: `tour.pageData.${activeStepType}.${innerStepsStatus}.title` })
    const subtitle = intl.formatMessage({ id: `tour.pageData.${activeStepType}.${innerStepsStatus}.subtitle` })
    const buttonLabel = isDefaultStep ? OpenGuideMessage : ChooseOtherTaskMessage
    const onButtonClick = isDefaultStep ? handleOpenGuide : handleBackClick
    const description = isDefaultStep && CompletedTourDescription

    return {
        title,
        subtitle,
        buttonLabel,
        onButtonClick,
        description,
    }
}