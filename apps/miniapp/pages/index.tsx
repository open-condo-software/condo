import { useState } from 'react'
import { useIntl } from '@core/next/intl'
import dayjs from 'dayjs'
import { Button } from '@condo/domains/common/components/Button'
import getConfig from 'next/config'
import { Typography } from 'antd'
import { get } from 'lodash'
import Head from 'next/head'
import faker from 'faker'
import { PageContent, PageHeader, PageWrapper } from '@miniapp/domains/common/components/BaseLayout'
import { useOidcAuth } from '@miniapp/domains/common/utils/oidcAuth'
import { useOrganization } from '@miniapp/domains/common/utils/organization'

const { publicRuntimeConfig: { condoUrl } } = getConfig()

const TasksExample = () => {
    const intl = useIntl()
    const TasksTitleMsg = intl.formatMessage({ id: 'pages.index.tasks.Title' })
    const TasksAddMsg = intl.formatMessage({ id: 'pages.index.tasks.Add' })
    const TasksUpdateMsg = intl.formatMessage({ id: 'pages.index.tasks.Update' })

    const [latestTaskRecord, setLatestTaskRecord] = useState({})

    const postMessageToAddTask = () => {
        // Should correspond to TaskRecord type
        const record = {
            id: faker.datatype.uuid(),
            status: 'processing',
            title: 'Task from mini-app',
            description: `Created at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
            progress: 50,
            // Used to find appropriate `ITask` interface implementation for this record
            __typename: 'MiniAppTask',
        }
        const message = {
            type: 'task',
            command: 'create',
            record,
        }
        setLatestTaskRecord(record)
        window.postMessage(message, condoUrl)
    }

    const postMessageToUpdateTask = () => {
        const record = {
            ...latestTaskRecord,
            description: `Updated at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
            progress: Math.floor(Math.random() * 100),
        }
        const message = {
            type: 'task',
            command: 'update',
            record,
        }
        window.postMessage(message, condoUrl)
    }

    return (
        <>
            <Typography.Title level={2}>
                {TasksTitleMsg}
            </Typography.Title>
            <Button onClick={postMessageToAddTask} type="primary">
                {TasksAddMsg}
            </Button>
            <Typography.Paragraph>
                Latest added task: {JSON.stringify(latestTaskRecord, null, '\t')}
            </Typography.Paragraph>

            <Button onClick={postMessageToUpdateTask} type="primary">
                {TasksUpdateMsg}
            </Button>
        </>
    )
}

const IndexPage = () => {
    const intl = useIntl()
    const auth = useOidcAuth()
    const organizationData = useOrganization()

    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })
    const userDataMsg = intl.formatMessage({ id: 'UserData' })
    const organizationDataMsg = intl.formatMessage({ id: 'OrganizationData' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={PageTitleMsg}/>
                <PageContent>
                    <Typography.Paragraph>
                        {userDataMsg}:
                        <Typography.Text code>
                            {get(auth, 'user.name', '-')}
                        </Typography.Text>
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                        {organizationDataMsg}:
                        <Typography.Text code>
                            {get(organizationData, 'organization.name', '-')}
                        </Typography.Text>
                    </Typography.Paragraph>

                    <TasksExample/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default IndexPage
