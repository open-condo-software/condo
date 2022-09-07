import React, { useCallback, useMemo } from 'react'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { Typography } from 'antd'

import { TicketOrganizationSetting } from '@app/condo/schema'

import { useIntl } from '@condo/next/intl'
import { TICKET_DEFAULT_DEADLINE_DURATION_FIELDS } from '@condo/domains/ticket/constants/common'
import { SettingCard } from '@condo/domains/common/components/settings/SettingCard'
import { convertDurationToDays } from '@condo/domains/ticket/utils/helpers'

interface TicketDeadlineSettingCardProps {
    ticketSetting?: TicketOrganizationSetting
}

const TICKET_DEADLINE_SETTINGS_URL = '/settings/ticketDeadlines'

const TYPOGRAPHY_STYLE: React.CSSProperties = { width: '100%' }

export const TicketDeadlineSettingCard: React.FC<TicketDeadlineSettingCardProps> = ({ ticketSetting }) => {
    const intl = useIntl()
    const TicketDeadlineTitle = intl.formatMessage({ id: 'pages.condo.settings.callCenter.card.ticketDeadlines.title' })
    const TicketWithoutDefaultDeadlineLabel = intl.formatMessage({ id: 'pages.condo.settings.callCenter.card.ticketDeadlines.withoutDeadline' })

    const router = useRouter()

    const handleClickCard = useCallback(() => {
        router.push(TICKET_DEADLINE_SETTINGS_URL)
    }, [router])

    return useMemo(() => {
        if (!ticketSetting) return null

        const humanizeDeadlines = TICKET_DEFAULT_DEADLINE_DURATION_FIELDS.map((fieldName) => {
            const deadlineDuration = get(ticketSetting, fieldName, null)
            let deadlineText
            if (deadlineDuration === null) {
                deadlineText = TicketWithoutDefaultDeadlineLabel
            } else {
                const deadline = convertDurationToDays(deadlineDuration)
                deadlineText = `+${intl.formatMessage({ id: 'DaysShort' }, { days: deadline })}`
            }
            return {
                label: `${intl.formatMessage({ id: `pages.condo.settings.callCenter.card.ticketDeadlines.type.${fieldName}` })}: ${deadlineText}`,
                type: fieldName,
            }
        })

        return (
            <SettingCard title={TicketDeadlineTitle} onClick={handleClickCard}>
                {
                    humanizeDeadlines.map(({ label, type }) => (
                        <Typography.Text key={type} type='secondary' ellipsis style={TYPOGRAPHY_STYLE}>
                            {label}
                        </Typography.Text>
                    ))
                }
            </SettingCard>
        )
    }, [TicketDeadlineTitle, TicketWithoutDefaultDeadlineLabel, handleClickCard, intl, ticketSetting])
}