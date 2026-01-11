import { 
    useGetTicketObserversByTicketIdQuery, 
    GetTicketByIdQuery,
    useGetEmployeesByOrganizationIdAndUserIdsQuery,
} from '@app/condo/gql'
import Link from 'next/link'
import { FC, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import {
    Typography,
} from '@open-condo/ui'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { TICKET_OBSERVERS } from '@condo/domains/common/constants/featureflags'
import { UserNameField } from '@condo/domains/user/components/UserNameField'


type TicketObserversFieldProps = {
    ticket: GetTicketByIdQuery['tickets'][0]
}

export const TicketObserversField: FC<TicketObserversFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const ObserversMessage = intl.formatMessage({ id: 'field.Observers' })
    const EmployeesIsNullOrWasDeletedMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.EmployeesIsNullOrWasDeleted' })
    const ticketOrganizationId = useMemo(() => ticket?.organization?.id || null, [ticket])

    const { persistor } = useCachePersistor()
    const { useFlag } = useFeatureFlags()
    const isTicketObserversEnabled = useFlag(TICKET_OBSERVERS)

    const {
        data: ticketObserversData,
        loading: ticketObserversLoading,
    } = useGetTicketObserversByTicketIdQuery({
        variables: {
            ticketId: ticket?.id,
        },
        skip: !isTicketObserversEnabled || !ticket?.id || !persistor,
    })
    const ticketObservers = useMemo(() => ticketObserversData?.observers?.filter(Boolean)?.filter(observer => observer?.user?.id) || [], [ticketObserversData?.observers])

    const {
        data: observersData,
        loading: observersLoading,
    } = useGetEmployeesByOrganizationIdAndUserIdsQuery({
        variables: {
            organizationId: ticketOrganizationId,
            userIds: ticketObservers.map(observer => observer?.user?.id),
        },
        skip: !isTicketObserversEnabled || !ticketOrganizationId || !persistor || !ticketObservers.length,
    })
    const observers = useMemo(() => observersData?.employees?.filter(Boolean) || [], [observersData])

    const renderObservers = useMemo(() => {
        return observers.map((observer, i) => (
            <div key={observer.id}>
                <UserNameField user={{ name: observer?.name, id: observer?.user?.id }}>
                    {({ name: userName, postfix }) => (
                        <>
                            <Link href={`/employee/${observer?.id}`}>
                                {userName}
                            </Link>
                            {postfix && (
                                <Typography.Text type='secondary'>&nbsp;{ postfix }</Typography.Text>
                            )}
                            {i !== observers.length - 1 && (
                                <>,<br /></>
                            )}
                        </>
                    )}
                </UserNameField>
            </div>
            
        ))
    }, [observers])

    const isLoading = ticketObserversLoading || observersLoading

    if (isLoading ||  !isTicketObserversEnabled) return null

    return (
        <PageFieldRow title={ObserversMessage} ellipsis>
            {
                observers.length > 0
                    ? <Typography.Text strong>
                        {renderObservers}
                    </Typography.Text>
                    : <Typography.Text type='secondary'>
                        {EmployeesIsNullOrWasDeletedMessage}
                    </Typography.Text>
            }
        </PageFieldRow>
    )
}
