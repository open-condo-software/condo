import { Form, notification } from 'antd'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button, Select, Checkbox } from '@open-condo/ui'
import type { CheckboxProps } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { DEFAULT_PAGE_SIZE } from '@/domains/miniapp/constants/common'
import { nonNull } from '@/domains/miniapp/utils/nonNull'

import styles from './PublishingSection.module.css'

import type { PublishB2CAppMutationVariables } from '@/lib/gql'

import { useAllB2CAppBuildsLazyQuery, usePublishB2CAppMutation } from '@/lib/gql'

const DEVELOPMENT_STAND = 'development'
const PRODUCTION_STAND = 'production'
const DEFAULT_STAND = DEVELOPMENT_STAND

type PublishFormValues = {
    environment: PublishB2CAppMutationVariables['data']['environment']
    info?: boolean
    buildId?: string
}

export const PublishingSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const PublishingTitle = intl.formatMessage({ id: 'apps.b2c.sections.publishing.title' })
    const SelectStandLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.stand.label' })
    const DevStandLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.stand.options.development.label' })
    const ProdStandLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.stand.options.production.label' })
    const PublishButtonLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.actions.publish' })
    const InfoLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.info.label' })
    const BuildLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.build.label' })
    const ChooseComponentsLabel = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.components.label' })
    const SelectBuildPlaceholder = intl.formatMessage({ id: 'apps.b2c.sections.publishing.publishForm.items.build.select.placeholder' })
    const ChangesPublishedTitle = intl.formatMessage({ id: 'apps.id.notifications.successPublish.title' })

    const [form] = Form.useForm()
    const [buildChecked, setBuildChecked] = useState(false)
    const [buildSearch, setBuildSearch] = useState('')
    const [isPublishing, setIsPublishing] = useState(false)

    const [fetchBuilds, { data: buildsData }] = useAllB2CAppBuildsLazyQuery({
        variables: {
            where: {
                app: { id },
                version_contains_i: buildSearch,
            },
            first: DEFAULT_PAGE_SIZE,
            skip: 0,
        },
    })

    const { requiredFieldValidator } = useValidations()

    const onError = useMutationErrorHandler()
    const onCompleted = useCallback(() => {
        notification.success( { message: ChangesPublishedTitle })
    }, [ChangesPublishedTitle])
    const [publishMutation] = usePublishB2CAppMutation({
        onError,
        onCompleted,
    })

    const handlePublish = useCallback((values: PublishFormValues) => {
        const data = {
            dv: 1,
            sender: getClientSideSenderInfo(),
            app: { id },
            environment: values.environment,
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
    }, [id, publishMutation])

    const handleBuildCheck = useCallback<Required<CheckboxProps>['onChange']>((evt) => {
        if (evt.target.checked) {
            fetchBuilds({
                variables: {
                    where: {
                        app: { id },
                    },
                    first: DEFAULT_PAGE_SIZE,
                    skip: 0,
                },
            })
        }
        setBuildChecked(evt.target.checked)
        setBuildSearch('')
    }, [fetchBuilds, id])

    const buildOptions = (buildsData?.builds || []).filter(nonNull).map(build => {
        return {
            label: build.version as string,
            key: build.version as string,
            value: build.id,
        }
    })

    return (
        <Section>
            <SubSection title={PublishingTitle}>
                <Form
                    name='b2c-app-publishing'
                    layout='vertical'
                    form={form}
                    onFinish={handlePublish}
                    initialValues={{ environment: DEFAULT_STAND }}
                >

                    <Form.Item name='environment' label={SelectStandLabel}>
                        <Select
                            options={[
                                { label: DevStandLabel, value: DEVELOPMENT_STAND, key: DEVELOPMENT_STAND },
                                { label: ProdStandLabel, value: PRODUCTION_STAND, key: PRODUCTION_STAND },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name='info' valuePropName='checked' label={ChooseComponentsLabel} className={styles.checkboxItem}>
                        <Checkbox label={InfoLabel}/>
                    </Form.Item>
                    <Form.Item name='build' valuePropName='checked' className={styles.checkboxItem}>
                        <Checkbox label={BuildLabel} onChange={handleBuildCheck}/>
                    </Form.Item>
                    {buildChecked && (
                        <Form.Item name='buildId' rules={[requiredFieldValidator]}>
                            <Select
                                onSearch={setBuildSearch}
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
            </SubSection>
        </Section>
    )
}