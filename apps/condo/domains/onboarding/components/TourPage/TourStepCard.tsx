import { TourStep as TourStepType, TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import { get } from 'lodash'
import isEmpty from 'lodash/isEmpty'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Tooltip } from '@open-condo/ui'

import { SECOND_LEVEL_STEPS, STEP_TRANSITIONS } from '@condo/domains/onboarding/constants/steps'
import { useTourContext } from '@condo/domains/onboarding/contexts/TourContext'
import {
    COMPLETED_STEP_LINK,
    TOUR_STEP_ACTION_PERMISSION,
} from '@condo/domains/onboarding/utils/clientSchema/constants'


type TourStepCardProps = {
    step: TourStepType
    steps: TourStepType[]
    onClick: () => void
    disabled: boolean
}

export const TourStepCard: React.FC<TourStepCardProps> = (props) => {
    const { step, steps, onClick, disabled } = props
    const { link } = useOrganization()
    const role = useMemo(() => get(link, 'role'), [link])

    const { activeTourStep } = useTourContext()

    const stepType = useMemo(() => step.type, [step.type])
    const stepStatus = useMemo(() => step.status, [step.status])

    const pathToCardTitleTranslation = useMemo(() => {
        const status = stepStatus === TourStepStatusType.Disabled ? TourStepStatusType.Todo : stepStatus

        if (stepType === TourStepTypeType.ViewResidentsAppGuide) {
            return `tour.step.${stepType}.${status}.${activeTourStep}.title`
        }

        return `tour.step.${stepType}.${status}.title`
    }, [activeTourStep, stepStatus, stepType])

    const pathToBodyDescription = useMemo(() => {
        if (stepType === TourStepTypeType.ViewResidentsAppGuide) {
            return `tour.step.${stepType}.${stepStatus}.${activeTourStep}.description`
        }

        return `tour.step.${stepType}.${stepStatus}.description`
    }, [activeTourStep, stepStatus, stepType])

    const intl = useIntl()
    const NoPermissionsMessage = intl.formatMessage({ id: 'tour.step.disabledTooltip.noPermission' })
    const CompletePreviousStepMessage = intl.formatMessage({ id: 'tour.step.disabledTooltip.completePreviousSteps' })
    const CompleteBillingStepResidentStepMessage = intl.formatMessage({ id: 'tour.step.disabledTooltip.completeBillingStep' })
    const CardTitle = intl.formatMessage({ id: pathToCardTitleTranslation })
    const BodyDescription = useMemo(() => SECOND_LEVEL_STEPS.includes(stepType) &&
            (stepStatus === TourStepStatusType.Todo || stepStatus === TourStepStatusType.Waiting) &&
            intl.formatMessage({ id: pathToBodyDescription })
    , [intl, pathToBodyDescription, stepStatus, stepType])
    const CompletedStepLinkLabel = useMemo(() => SECOND_LEVEL_STEPS.includes(stepType) &&
            stepStatus === TourStepStatusType.Completed &&
            intl.formatMessage({ id: `tour.step.${stepType}.completed.linkTitle` })
    , [intl, stepStatus, stepType])

    const completedStepLink = useMemo(() => SECOND_LEVEL_STEPS.includes(stepType) &&
        stepStatus === TourStepStatusType.Completed &&
            ({ label: CompletedStepLinkLabel, ...COMPLETED_STEP_LINK[stepType] }),
    [CompletedStepLinkLabel, stepStatus, stepType])

    const innerStepsTypes = useMemo(() => STEP_TRANSITIONS[stepType] || [], [stepType])
    const innerStepsStatuses = useMemo(() => innerStepsTypes
        .map(type => steps.find(otherStep => otherStep.type === type))
        .filter(Boolean)
        .map(step => step.status)
    , [innerStepsTypes, steps])
    const innerSteps = useMemo(() => isEmpty(innerStepsStatuses) ? [stepStatus] : innerStepsStatuses,
        [innerStepsStatuses, stepStatus])
    const isInnerTodoStep = useMemo(() => SECOND_LEVEL_STEPS.includes(stepType) && stepStatus === TourStepStatusType.Todo, [stepStatus, stepType])

    const hasPermission = useMemo(() => stepStatus !== TourStepStatusType.Completed && TOUR_STEP_ACTION_PERMISSION[stepType] ?
        get(role, TOUR_STEP_ACTION_PERMISSION[stepType]) : true, [role, stepStatus, stepType])
    const disabledMessage = useMemo(() => {
        if (!hasPermission) {
            return NoPermissionsMessage
        }

        if (stepType === TourStepTypeType.Resident) {
            const uploadReceiptsStep = steps.find(step => step.type === TourStepTypeType.UploadReceipts)
            if (uploadReceiptsStep && uploadReceiptsStep.status !== TourStepStatusType.Completed) {
                return CompleteBillingStepResidentStepMessage
            }
        }

        return CompletePreviousStepMessage
    }, [CompleteBillingStepResidentStepMessage, CompletePreviousStepMessage, NoPermissionsMessage, hasPermission, stepType, steps])
    const isDisabledStatus = useMemo(() => stepStatus === TourStepStatusType.Disabled || !hasPermission || disabled, [disabled, hasPermission, stepStatus])

    const cardContent = (
        <Card.CardButton
            header={{
                progressIndicator: { disabled: isDisabledStatus, steps: innerSteps },
                headingTitle: CardTitle,
                mainLink: completedStepLink,
            }}
            body={!isDisabledStatus && BodyDescription && {
                description: BodyDescription,
            }}
            onClick={onClick}
            disabled={isDisabledStatus}
            accent={!isDisabledStatus && isInnerTodoStep}
            id={step.type}
        />
    )

    if (isDisabledStatus) {
        return (
            <Tooltip title={disabledMessage}>
                <div style={{ width: '100%' }}>
                    {cardContent}
                </div>
            </Tooltip>
        )
    }

    return cardContent
}