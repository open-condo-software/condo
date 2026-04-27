import { Form, notification } from 'antd'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import type { CheckboxProps } from '@open-condo/ui'
import { Button, Checkbox, Select } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import styles from '@/domains/miniapp/components/B2CApp/edit/publishing/PublishForm.module.css'
import { DEFAULT_PAGE_SIZE } from '@/domains/miniapp/constants/common'

import {
    AppEnvironment,
    B2CAppTypeType,
    GetB2CAppDocument,
    useAllB2CAppBuildsLazyQuery,
    useGetB2CAppQuery,
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
    const ChooseComponentsLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.components.label' })
    const InfoLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.info.label' })
    const BuildLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.build.label' })
    const SelectBuildPlaceholder = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.build.select.placeholder' })
    const PublishButtonLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.actions.publish' })
    const ChangesPublishedTitle = intl.formatMessage({ id: 'pages.apps.any.id.notifications.successPublish.title' })

    const [buildChecked, setBuildChecked] = useState(false)
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

    const { data } = useGetB2CAppQuery({
        variables: {
            id,
        },
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

    const handleBuildCheck = useCallback<Required<CheckboxProps>['onChange']>((evt) => {
        if (evt.target.checked) {
            fetchBuilds({
                variables: {
                    where: {
                        app: { id },
                        version_contains_i: '',
                    },
                    first: DEFAULT_PAGE_SIZE,
                    skip: 0,
                },
            })
        }
        setBuildChecked(evt.target.checked)
    }, [fetchBuilds, id])

    const handleSearchChange = useCallback((newSearch: string) => {
        fetchBuilds({
            variables: {
                where: {
                    app: { id },
                    version_contains_i: newSearch,
                },
                first: DEFAULT_PAGE_SIZE,
                skip: 0,
            },
        })
    }, [fetchBuilds, id])

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
            <Form.Item name='info' valuePropName='checked' label={ChooseComponentsLabel} className={styles.checkboxItem}>
                <Checkbox label={InfoLabel}/>
            </Form.Item>
            {Boolean(data?.app?.type !== B2CAppTypeType.Web) && (
                <Form.Item name='build' valuePropName='checked' className={styles.checkboxItemLast}>
                    <Checkbox label={BuildLabel} onChange={handleBuildCheck}/>
                </Form.Item>
            )}
            {buildChecked && (
                <Form.Item name='buildId' rules={[requiredFieldValidator]} className={styles.buildSelector}>
                    <Select
                        onSearch={handleSearchChange}
                        optionFilterProp='key'
                        options={buildOptions}
                        placeholder={SelectBuildPlaceholder}
                        showSearch
                    />
                </Form.Item>
            )}
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