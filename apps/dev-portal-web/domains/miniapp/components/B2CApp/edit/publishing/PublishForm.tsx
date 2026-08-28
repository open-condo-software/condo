import { Form, notification } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Select } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import styles from '@/domains/miniapp/components/B2CApp/edit/publishing/PublishForm.module.css'
import { DEFAULT_PAGE_SIZE } from '@/domains/miniapp/constants/common'

import {
    AppEnvironment,
    GetB2CAppDocument,
    useAllB2CAppBuildsLazyQuery,
    usePublishB2CAppMutation,
} from '@/gql'

type PublishFormProps = {
    id: string
    environment: AppEnvironment
}

type PublishFormValues = {
    info?: boolean
    buildId?: string
}

export const PublishForm: React.FC<PublishFormProps> = ({ id, environment }) => {
    const intl = useIntl()
    const SelectBuildPlaceholder = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.build.select.placeholder' })
    const PublishButtonLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.actions.publish' })
    const ChangesPublishedTitle = intl.formatMessage({ id: 'pages.apps.any.id.notifications.successPublish.title' })

    const [search, setSearch] = useState<string | null>(null)
    const [isPublishing, setIsPublishing] = useState(false)
    const [form] = Form.useForm()

    const onError = useMutationErrorHandler()
    const onCompleted = useCallback(() => {
        notification.success( { message: ChangesPublishedTitle })
    }, [ChangesPublishedTitle])
    const [publishMutation] = usePublishB2CAppMutation({
        onError,
        onCompleted,
        refetchQueries: [{ query: GetB2CAppDocument, variables: { id } }],
    })

    const { requiredFieldValidator } = useValidations()

    const [fetchBuilds, { data: buildsData }] = useAllB2CAppBuildsLazyQuery({
        variables: {
            where: {
                app: { id },
                version_contains_i: '',
            },
            first: DEFAULT_PAGE_SIZE,
            skip: 0,
        },
    })

    useEffect(() => {
        fetchBuilds({
            variables: {
                where: {
                    app: { id },
                    version_contains_i: search ?? '',
                },
                first: DEFAULT_PAGE_SIZE,
                skip: 0,
            },
        })
    }, [fetchBuilds, id, search])

    const handleSearchChange = useCallback((newSearch: string) => {
        setSearch(newSearch)
    }, [])

    const handlePublish = useCallback((values: PublishFormValues) => {
        const data = {
            dv: 1,
            sender: getClientSideSenderInfo(),
            app: { id },
            environment,
            options: {
                info: values.info,
                build: values.buildId ? { id: values.buildId } : undefined,
            },
        }
        setIsPublishing(true)
        publishMutation({
            variables: {
                data,
            },
        }).finally(() => { setIsPublishing(false) })
    }, [environment, id, publishMutation])

    const buildOptions = (buildsData?.builds || []).filter(nonNull).map(build => {
        return {
            label: build.version as string,
            key: build.version as string,
            value: build.id,
        }
    })

    return (
        <Form
            name='publish-b2c-app-form'
            layout='vertical'
            form={form}
            onFinish={handlePublish}
        >
            <Form.Item name='buildId' rules={[requiredFieldValidator]} className={styles.buildSelector}>
                <Select
                    onSearch={handleSearchChange}
                    optionFilterProp='key'
                    options={buildOptions}
                    placeholder={SelectBuildPlaceholder}
                    showSearch
                />
            </Form.Item>
            <Button
                type='primary'
                htmlType='submit'
                className={styles.submitButton}
                loading={isPublishing}
                disabled={isPublishing}
            >
                {PublishButtonLabel}
            </Button>
        </Form>
    )
}