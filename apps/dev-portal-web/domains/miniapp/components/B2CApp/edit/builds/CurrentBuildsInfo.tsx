import { Skeleton, Flex } from 'antd'
import Link from 'next/link'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { List, Alert, Typography } from '@open-condo/ui'

import { useGetB2CAppInfoQuery, AppEnvironment } from '@/gql'

const ALERT_GAP = 24

const LoadingVersionSkeleton: React.FC = () => {
    return <Skeleton paragraph={{ rows: 1, width: 100 }} title={false} active />
}

const CurrentBuildsInfo: React.FC<{ id: string }> = React.memo(({ id }) => {
    const intl = useIntl()
    const DevBuildVersionLabel = intl.formatMessage({ id: 'apps.b2c.sections.builds.currentBuildsList.items.development.label' })
    const ProdBuildVersionLabel = intl.formatMessage({ id: 'apps.b2c.sections.builds.currentBuildsList.items.production.label' })
    const NoBuildText = intl.formatMessage({ id: 'apps.b2c.sections.builds.currentBuildsList.noBuild.text' })
    const PublishSectionText = intl.formatMessage({ id: 'apps.b2c.sections.publishing.title' })
    const PublishAlertDescription = intl.formatMessage({ id: 'apps.b2c.sections.builds.currentBuildsList.publishAlert.description' }, {
        section: (
            <Typography.Link component={Link} href={`/apps/b2c/${id}?section=publishing`}>
                {PublishSectionText}
            </Typography.Link>
        ),
    })

    const { persistor } = useCachePersistor()
    
    const { data: devData, loading: devLoading } = useGetB2CAppInfoQuery({
        variables: { data: { app: { id }, environment: AppEnvironment.Development } },
        skip: !persistor,
        fetchPolicy: 'cache-and-network',
    })

    const { data: prodData, loading: prodLoading } = useGetB2CAppInfoQuery({
        variables: { data: { app: { id }, environment: AppEnvironment.Production } },
        skip: !persistor,
        fetchPolicy: 'cache-and-network',
    })

    const devValue = useMemo(() => {
        if (devLoading) return <LoadingVersionSkeleton />

        return devData?.info?.currentBuild?.version || NoBuildText
    }, [NoBuildText, devData?.info?.currentBuild?.version, devLoading])

    const prodValue = useMemo(() => {
        if (prodLoading) return <LoadingVersionSkeleton />
        return prodData?.info?.currentBuild?.version || NoBuildText
    }, [NoBuildText, prodData?.info?.currentBuild?.version, prodLoading])


    return (
        <Flex vertical gap={ALERT_GAP}>
            <List
                dataSource={[
                    { label: ProdBuildVersionLabel, value: prodValue },
                    { label: DevBuildVersionLabel, value: devValue },
                ]}
            />
            <Alert type='info' showIcon description={PublishAlertDescription}/>
        </Flex>
    )
})

CurrentBuildsInfo.displayName = 'CurrentBuildsInfo'

export { CurrentBuildsInfo }