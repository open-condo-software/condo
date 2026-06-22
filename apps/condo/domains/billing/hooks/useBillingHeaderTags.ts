import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { colors } from '@open-condo/ui/colors'

import {
    CONTEXT_ERROR_STATUS as ACQUIRING_CONTEXT_ERROR_STATUS,
    CONTEXT_IN_PROGRESS_STATUS as ACQUIRING_CONTEXT_IN_PROGRESS_STATUS,
    CONTEXT_VERIFICATION_STATUS as ACQUIRING_CONTEXT_VERIFICATION_STATUS,
} from '@condo/domains/acquiring/constants/context'
import { CONTEXT_IN_PROGRESS_STATUS as BILLING_CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/billing/constants/constants'
import { useBillingPartnerContexts } from '@condo/domains/billing/hooks/useBillingPartnerContexts'

import type { AcquiringIntegrationContext, BillingIntegrationOrganizationContext } from '@app/condo/schema'

type HeaderTagStatus = 'default' | 'warning' | 'error'

export type BillingHeaderTag = {
    key: string
    label: string
    bgColor: string
    textColor: string
    tooltipMessage: string | null
}

type HeaderTagConfig = {
    key: string
    label: string
    status: HeaderTagStatus
    tooltipMessage: string | null
}

function getTagColors (status: HeaderTagStatus): Pick<BillingHeaderTag, 'bgColor' | 'textColor'> {
    if (status === 'error') {
        return { bgColor: colors.red['5'], textColor: colors.white }
    }

    if (status === 'warning') {
        return { bgColor: colors.orange['5'], textColor: colors.white }
    }

    return { bgColor: colors.gray[3], textColor: colors.gray[7] }
}

function getBillingContextTag (context: BillingIntegrationOrganizationContext): HeaderTagConfig | null {
    const label = context.integration?.name
    if (!label) return null

    const tooltipMessage = context.currentProblem?.message
        || context.currentProblem?.title
        || null

    return {
        key: context.integration?.id || context.id,
        label,
        status: tooltipMessage ? 'error' : 'default',
        tooltipMessage,
    }
}

function getCustomBillingTag ({
    context,
    key,
    label,
    inProgressMessage,
}: {
    context?: BillingIntegrationOrganizationContext | AcquiringIntegrationContext | null
    key: string
    label: string
    inProgressMessage: string
}): HeaderTagConfig | null {
    if (!context) return null

    const problemMessage = 'currentProblem' in context
        ? context.currentProblem?.message || context.currentProblem?.title || null
        : null

    const isInProgress = context.status === BILLING_CONTEXT_IN_PROGRESS_STATUS
        || context.status === ACQUIRING_CONTEXT_IN_PROGRESS_STATUS
        || context.status === ACQUIRING_CONTEXT_VERIFICATION_STATUS
    const isError = Boolean(problemMessage) || context.status === ACQUIRING_CONTEXT_ERROR_STATUS

    return {
        key,
        label,
        status: isError ? 'error' : isInProgress ? 'warning' : 'default',
        tooltipMessage: isError ? problemMessage : isInProgress ? inProgressMessage : null,
    }
}

function mapTagConfigToHeaderTag ({ key, label, status, tooltipMessage }: HeaderTagConfig): BillingHeaderTag {
    const { bgColor, textColor } = getTagColors(status)

    return {
        key,
        label,
        bgColor,
        textColor,
        tooltipMessage,
    }
}

export const useBillingHeaderTags = (): {
    legacyHeaderTags: BillingHeaderTag[]
    combinedHeaderTags: BillingHeaderTag[]
} => {
    const intl = useIntl()
    const {
        billingContexts,
        sppBillingContext,
        platformPartnerContext,
        activePlatformPartnerContext,
    } = useBillingPartnerContexts()

    const ErrorStatusMessage = intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.error' })
    const InProgressTooltipMessage = intl.formatMessage({ id: 'accrualsAndPayments.combined.tag.inProgress' })
    const sppBillingId = sppBillingContext?.integration?.id || null

    const allBillingTags = useMemo(() => {
        return billingContexts
            .map(getBillingContextTag)
            .filter(Boolean) as HeaderTagConfig[]
    }, [billingContexts])

    const combinedBillingTags = useMemo(() => {
        return allBillingTags.filter(({ key }) => key !== sppBillingId)
    }, [allBillingTags, sppBillingId])

    const legacyHeaderTags = useMemo(() => {
        const problemContext = billingContexts.find(({ currentProblem }) => Boolean(currentProblem))
        const hasProblem = Boolean(problemContext?.currentProblem)
        const { bgColor, textColor } = hasProblem
            ? { bgColor: colors.red['5'], textColor: colors.white }
            : { bgColor: colors.green['5'], textColor: colors.white }

        return allBillingTags.map(({ key, label }) => ({
            key,
            label: hasProblem ? intl.formatMessage({ id: 'accrualsAndPayments.billing.statusTag.error' }, { name: label }) : label,
            bgColor,
            textColor,
            tooltipMessage: hasProblem ? ErrorStatusMessage : null,
        }))
    }, [ErrorStatusMessage, allBillingTags, billingContexts, intl])

    const combinedHeaderTags = useMemo(() => {
        const tags = [...combinedBillingTags]
        const bankPartnerTag = getCustomBillingTag({
            context: sppBillingContext,
            key: 'custom-bank-partner',
            label: sppBillingContext?.integration?.name || '',
            inProgressMessage: InProgressTooltipMessage,
        })
        const platformPartnerTag = getCustomBillingTag({
            context: platformPartnerContext,
            key: 'custom-platform-partner',
            label: activePlatformPartnerContext?.integration?.name || platformPartnerContext?.integration?.name || '',
            inProgressMessage: InProgressTooltipMessage,
        })

        if (bankPartnerTag) tags.push(bankPartnerTag)
        if (platformPartnerTag) tags.push(platformPartnerTag)

        return tags.map(mapTagConfigToHeaderTag)
    }, [
        InProgressTooltipMessage,
        activePlatformPartnerContext?.integration?.name,
        combinedBillingTags,
        platformPartnerContext,
        sppBillingContext,
    ])

    return {
        legacyHeaderTags,
        combinedHeaderTags,
    }
}
