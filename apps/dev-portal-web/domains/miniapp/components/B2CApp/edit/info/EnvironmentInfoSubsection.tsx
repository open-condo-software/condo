import { Form } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { Select, Input } from '@open-condo/ui'
import type { SelectProps } from '@open-condo/ui'

import { CopyableInput } from '@/domains/common/components/CopyableInput'
import {
    DEV_ENVIRONMENT,
    PROD_ENVIRONMENT,
} from '@dev-portal-api/domains/miniapp/constants/publishing'

import { AppEnvironment, useGetB2CAppQuery, useGetB2CAppInfoQuery } from '@/gql'

const { publicRuntimeConfig: { environmentsUris } } = getConfig()

const DEFAULT_STAND = DEV_ENVIRONMENT

export const EnvironmentInfoSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const DevStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.development.label' })
    const ProdStandLabel = intl.formatMessage({ id: 'global.miniapp.environments.production.label' })
    const SelectStandLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.environmentInfo.form.items.stand.label' })
    const AppIdLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.environmentInfo.form.items.appId.label' })
    const AppIdPlaceholder = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.environmentInfo.form.items.appId.placeholder' })
    const EnvironmentUriLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.environmentInfo.form.items.environmentUri.label' })
    const CurrentBuildLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.environmentInfo.form.items.currentBuild.label' })
    const CurrentBuildPlaceholder = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.environmentInfo.form.items.currentBuild.placeholder' })

    const [form] = Form.useForm()
    const [environment, setEnvironment] = useState<AppEnvironment>(DEFAULT_STAND as AppEnvironment)

    const { persistor } = useCachePersistor()

    const handleEnvironmentChange = useCallback<Required<SelectProps>['onChange']>((value) => {
        setEnvironment(value as AppEnvironment)
    }, [])

    const { data } = useGetB2CAppQuery({ variables: { id } })

    const { data: infoData, loading } = useGetB2CAppInfoQuery({
        variables: { data: { app: { id }, environment } },
        skip: !persistor,
        fetchPolicy: 'cache-and-network',
    })

    const currentBuild = infoData?.info?.currentBuild?.version

    const appId = useMemo(() => {
        return data?.app?.[`${environment}ExportId`]
    }, [data?.app, environment])

    const environmentUri: string | undefined = useMemo(() => {
        return environmentsUris[environment]
    }, [environment])
    
    useEffect(() => {
        form.setFieldValue('appId', appId)
    }, [appId, form])

    useEffect(() => {
        form.setFieldValue('environmentUri', environmentUri)
    }, [environmentUri, form])


    return (
        <Form
            name='environment-app-info'
            layout='vertical'
            initialValues={{ environment: DEFAULT_STAND, appId }}
            form={form}
        >
            <Form.Item name='environment' label={SelectStandLabel}>
                <Select
                    options={[
                        { label: DevStandLabel, value: DEV_ENVIRONMENT, key: DEV_ENVIRONMENT },
                        { label: ProdStandLabel, value: PROD_ENVIRONMENT, key: PROD_ENVIRONMENT },
                    ]}
                    onChange={handleEnvironmentChange}
                />
            </Form.Item>
            {environmentUri && (
                <Form.Item name='environmentUri' label={EnvironmentUriLabel}>
                    <CopyableInput value={environmentUri}/>
                </Form.Item>
            )}
            <Form.Item
                name='appId'
                label={AppIdLabel}
                valuePropName='data-value'
            >
                {
                    appId
                        ? <CopyableInput value={appId}/>
                        : <Input readOnly disabled placeholder={AppIdPlaceholder} value={AppIdPlaceholder}/>
                }
            </Form.Item>
            <Form.Item
                name='currentBuild'
                label={CurrentBuildLabel}
                valuePropName='data-value'
            >
                {
                    currentBuild
                        ? <CopyableInput value={currentBuild}/>
                        : <Input readOnly disabled placeholder={CurrentBuildPlaceholder} value={CurrentBuildPlaceholder}/>
                }
            </Form.Item>
        </Form>
    )
}