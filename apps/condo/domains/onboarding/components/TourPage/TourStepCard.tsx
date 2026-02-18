import { TourStep as TourStepType, TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useMemo } from 'react'

import { Settings } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Space, Tooltip, Typography } from '@open-condo/ui'

import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { SECOND_LEVEL_STEPS, STEP_TRANSITIONS } from '@condo/domains/onboarding/constants/steps'
import { useTourContext } from '@condo/domains/onboarding/contexts/TourContext'
import {
    COMPLETED_STEP_LINK,
    TOUR_STEP_ACTION_PERMISSION,
} from '@condo/domains/onboarding/utils/clientSchema/constants'
import { NoSubscriptionTooltip } from '@condo/domains/subscription/components'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import type { AvailableFeature } from '@condo/domains/subscription/constants/features'

/**
 * Mapping of step types to required subscription features
 */
const TOUR_STEP_REQUIRED_FEATURE: Partial<Record<TourStepTypeType, AvailableFeature>> = {
    [TourStepTypeType.CreateNews]: 'news',
}


type TourStepCardProps = {
    step: TourStepType
    steps: TourStepType[]
    onClick: () => void
    disabled: boolean
}

const StyledCardButton = styled(Card.CardButton)<{ status: string }>`
    cursor: ${(props) => props.status === TourStepStatusType.Todo ? 'pointer' : 'auto'};
`

export const TourStepCard: React.FC<TourStepCardProps> = (props) => {
    const { step, steps, onClick, disabled } = props
    const { link } = useOrganization()
    const role = useMemo(() => get(link, 'role'), [link])
    const { isFeatureAvailable } = useOrganizationSubscription()

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
    const CardTitle = intl.formatMessage({ id: pathToCardTitleTranslation as FormatjsIntl.Message['ids'] })
    const BodyDescription = useMemo(() => SECOND_LEVEL_STEPS.includes(stepType) &&
            (stepStatus === TourStepStatusType.Todo || stepStatus === TourStepStatusType.Waiting) &&
            intl.formatMessage({ id: pathToBodyDescription as FormatjsIntl.Message['ids'] })
    , [intl, pathToBodyDescription, stepStatus, stepType])
    const CompletedStepLinkLabel = useMemo(() => SECOND_LEVEL_STEPS.includes(stepType) &&
            stepStatus === TourStepStatusType.Completed &&
            intl.formatMessage({ id: `tour.step.${stepType}.completed.linkTitle` as FormatjsIntl.Message['ids'] })
    , [intl, stepStatus, stepType])
    const SettingsMessage = intl.formatMessage({ id: 'global.section.settings' })

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
    
    const requiredFeature = TOUR_STEP_REQUIRED_FEATURE[stepType]
    const hasRequiredFeature = useMemo(() => {
        if (!requiredFeature) return true
        return isFeatureAvailable(requiredFeature)
    }, [requiredFeature, isFeatureAvailable])

    const disabledMessage = useMemo(() => {
        if (!hasPermission) {
            return (
                <Space size={12} direction='vertical'>
                    <Typography.Text size='small'>{NoPermissionsMessage}</Typography.Text>
                    <LinkWithIcon
                        PrefixIcon={Settings}
                        title={SettingsMessage}
                        href='/settings'
                        target='_blank'
                        size='medium'
                    />
                </Space>
            )
        }

        return CompletePreviousStepMessage
    }, [CompletePreviousStepMessage, NoPermissionsMessage, SettingsMessage, hasPermission])
    const isDisabledStatus = useMemo(() => stepStatus === TourStepStatusType.Disabled || !hasPermission || !hasRequiredFeature || disabled, [disabled, hasPermission, hasRequiredFeature, stepStatus])

    const cardContent = (
        <StyledCardButton
            status={stepStatus}
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

    if (!hasRequiredFeature) {
        return (
            <NoSubscriptionTooltip key={step.id}>
                <div style={{ width: '100%' }}>
                    {cardContent}
                </div>
            </NoSubscriptionTooltip>
        )
    }

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