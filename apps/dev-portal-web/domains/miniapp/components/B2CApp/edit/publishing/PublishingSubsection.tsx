import get from 'lodash/get'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { SubDivider } from '@/domains/common/components/SubDivider'
import { AutoPublishView } from '@/domains/miniapp/components/Publishing/AutoPublishView'

import { PublishForm } from './PublishForm'
import { RequestStatusInfo } from './RequestStatusInfo'

import {
    AppEnvironment,
    B2CAppPublishRequestStatusType, B2CAppTypeType,
    useAllB2CAppPublishRequestsQuery,
    useGetB2CAppQuery,
} from '@/gql'

type PublishingSubsectionProps = {
    id: string
    environment: AppEnvironment
}

export const PublishingSubsection: React.FC<PublishingSubsectionProps> = ({ environment, id }) => {
    const intl = useIntl()
    const SubsectionTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishing.subtitle' })

    const { data: requestsData, loading: requestsLoading } = useAllB2CAppPublishRequestsQuery({
        variables: { appId: id },
        skip: environment !== AppEnvironment.Production,
    })
    const { data } = useGetB2CAppQuery({
        variables: {
            id,
        },
    })
    const publishRequest = get(requestsData, ['requests', '0'], null)
    const publishRequestStatus = get(publishRequest, 'status')

    const SubsectionContent = useMemo(() => {
        if (environment === AppEnvironment.Production && publishRequestStatus !== B2CAppPublishRequestStatusType.Approved) {
            return <RequestStatusInfo request={publishRequest} appId={id} loading={requestsLoading}/>
        }

        if (data?.app?.type === B2CAppTypeType.Web) {
            return <AutoPublishView environment={environment}/>
        }

        return <PublishForm id={id} environment={environment}/>
    }, [data?.app?.type, environment, id, publishRequest, publishRequestStatus, requestsLoading])

    return (
        <>
            <SubDivider title={SubsectionTitle}/>
            {SubsectionContent}
        </>
    )
}