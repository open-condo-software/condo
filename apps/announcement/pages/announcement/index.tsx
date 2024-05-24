import { Col, Row } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { AnnouncementTemplate } from '@announcement/domains/announcement/utils/clientSchema'
import { PageHeader, PageWrapper, PageContent } from '@announcement/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { Table } from '@condo/domains/common/components/Table/Index'


const AnnouncementsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.announcement.index.Title' })
    const NameColumnTitle = intl.formatMessage({ id: 'templatesTable.header.name' })

    const router = useRouter()

    const { objs: announcementTemplates, loading: templatesLoading } = AnnouncementTemplate.useObjects({})

    const columns = useMemo(() => ([
        {
            title: NameColumnTitle,
            dataIndex: 'name',
            key: 'name',
        },
    ]), [])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/announcement/${record.id}/generate`)
            },
        }
    }, [router])

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Table
                        columns={columns}
                        dataSource={announcementTemplates}
                        loading={templatesLoading}
                        onRow={handleRowAction}
                    />
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default AnnouncementsPage