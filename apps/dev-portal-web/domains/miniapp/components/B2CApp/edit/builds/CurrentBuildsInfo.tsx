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
    const DevBuildVersionLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.currentBuildsList.items.development.label' })
    const ProdBuildVersionLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.currentBuildsList.items.production.label' })
    const NoBuildText = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.currentBuildsList.noBuild.text' })
    const BuildLoadingErrorText = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.currentBuildsList.buildLoadingError.text' })
    const PublishSectionText = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.title' })
    const PublishAlertDescription = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.builds.currentBuildsList.publishAlert.description' }, {
        section: (
            <Typography.Link component={Link} href={`/apps/b2c/${id}?section=publishing`}>
                {PublishSectionText}
            </Typography.Link>
        ),
    })

    const { persistor } = useCachePersistor()
    
    const { data: devData, loading: devLoading, error: devError } = useGetB2CAppInfoQuery({
        variables: { data: { app: { id }, environment: AppEnvironment.Development } },
        skip: !persistor,
        fetchPolicy: 'cache-and-network',
    })

    const { data: prodData, loading: prodLoading, error: prodError } = useGetB2CAppInfoQuery({
        variables: { data: { app: { id }, environment: AppEnvironment.Production } },
        skip: !persistor,
        fetchPolicy: 'cache-and-network',
    })

    const devValue = useMemo(() => {
        if (devLoading) return <LoadingVersionSkeleton />
        if (devError) return BuildLoadingErrorText

        return devData?.info?.currentBuild?.version || NoBuildText
    }, [BuildLoadingErrorText, NoBuildText, devData?.info?.currentBuild?.version, devError, devLoading])

    const prodValue = useMemo(() => {
        if (prodLoading) return <LoadingVersionSkeleton />
        if (prodError) return BuildLoadingErrorText
        return prodData?.info?.currentBuild?.version || NoBuildText
    }, [BuildLoadingErrorText, NoBuildText, prodData?.info?.currentBuild?.version, prodError, prodLoading])


    return (
        <Flex vertical gap={ALERT_GAP}>
            <List
                dataSource={[
                    // @ts-expect-error TS2322: Type string | Element is not assignable to type string
                    { label: ProdBuildVersionLabel, value: prodValue },
                    // @ts-expect-error TS2322: Type string | Element is not assignable to type string
                    { label: DevBuildVersionLabel, value: devValue },
                ]}
            />
            <Alert type='info' showIcon description={PublishAlertDescription}/>
        </Flex>
    )
})

CurrentBuildsInfo.displayName = 'CurrentBuildsInfo'

export { CurrentBuildsInfo }