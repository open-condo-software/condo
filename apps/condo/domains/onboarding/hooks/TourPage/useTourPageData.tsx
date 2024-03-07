import { TourStepStatusType } from '@app/condo/schema'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useTourContext } from '@condo/domains/onboarding/contexts/TourContext'
import { EXTERNAL_GUIDE_LINK } from '@condo/domains/onboarding/utils/clientSchema/constants'


export const useTourPageData = ({ isAllSecondStepsCompleted, isInnerStepsCompleted }) => {
    const intl = useIntl()
    const CompletedTourDescription = intl.formatMessage({ id: 'tour.pageData.default.completed.description' })
    const OpenGuideMessage = intl.formatMessage({ id: 'tour.openGuide' })
    const ChooseOtherTaskMessage = intl.formatMessage({ id: 'tour.chooseOtherTask' })

    const { activeTourStep, setActiveTourStep } = useTourContext()

    const handleBackClick = useCallback(() => setActiveTourStep(null), [setActiveTourStep])
    const handleOpenGuide = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.open(EXTERNAL_GUIDE_LINK, '_blank')
        }
    }, [])

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