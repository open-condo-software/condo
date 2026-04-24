import get from 'lodash/get'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { SubDivider } from '@/domains/common/components/SubDivider'

import { PublishForm } from './PublishForm'
import { RequestStatusInfo } from './RequestStatusInfo'

import { AppEnvironment, useAllB2CAppPublishRequestsQuery, B2CAppPublishRequestStatusType } from '@/gql'

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
    const publishRequest = get(requestsData, ['requests', '0'], null)
    const publishRequestStatus = get(publishRequest, 'status')

    const SubsectionContent = useMemo(() => {
        if ((environment !== AppEnvironment.Production || publishRequestStatus === B2CAppPublishRequestStatusType.Approved)) {
            return <PublishForm id={id} environment={environment}/>
        }

        return <RequestStatusInfo request={publishRequest} appId={id} loading={requestsLoading}/>
    }, [environment, id, publishRequest, publishRequestStatus, requestsLoading])

    return (
        <>
            <SubDivider title={SubsectionTitle}/>
            {SubsectionContent}
        </>
    )
}