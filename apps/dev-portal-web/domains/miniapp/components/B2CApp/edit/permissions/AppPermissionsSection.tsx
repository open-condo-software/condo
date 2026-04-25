import { Table, Row, Col } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Checkbox } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { useMutationCompletedHandler } from '@/domains/miniapp/hooks/useMutationCompletedHandler'

import type { RowProps } from 'antd'
import type { TableColumnType } from 'antd'

import { useGetB2CAppQuery, AppEnvironment, GetB2CAppQuery, useUpdateB2CAppMutation, GetB2CAppDocument } from '@/gql'

type AppType = GetB2CAppQuery['app']

type DevicePermissionsSectionProps = {
    id: string
}

type RowType = {
    permission: string
    developmentKey?: string
    developmentValue?: boolean
    productionKey?: string
    productionValue?: boolean
}

const PERMISSION_KEY_SUFFIX = 'Allowed'
const BUTTON_GUTTER: RowProps['gutter'] = [48, 48]
const FULL_COL_SPAN = 24

function getPermissionName (key: string) {
    if (!key.endsWith(PERMISSION_KEY_SUFFIX)) return null
    if (key.startsWith(AppEnvironment.Development)) {
        return key.slice(AppEnvironment.Development.length, -PERMISSION_KEY_SUFFIX.length)
    } else if (key.startsWith(AppEnvironment.Production)) {
        return key.slice(AppEnvironment.Production.length, -PERMISSION_KEY_SUFFIX.length)
    }

    return null
}

function extractAppPermissions (app?: AppType): Record<string, boolean> {
    const result: Record<string, boolean> = {}

    for (const [key, value] of Object.entries(app ?? {})) {
        if (getPermissionName(key) && typeof value === 'boolean') {
            result[key] = value
        }
    }

    return result
}


export const AppPermissionsSection: React.FC<DevicePermissionsSectionProps> = ({ id }) => {
    const intl = useIntl()
    const SectionTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.permissions.title' })
    const PermissionColumnTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.permissions.table.columns.permission.title' })
    const DevelopmentColumnTitle = intl.formatMessage({ id: 'global.miniapp.environments.development.label' })
    const ProductionColumnTitle = intl.formatMessage({ id: 'global.miniapp.environments.production.label' })
    const SaveActionLabel = intl.formatMessage({ id: 'global.actions.save' })

    const { data } = useGetB2CAppQuery({
        variables: { id },
    })

    const [appPermissions, setAppPermissions] = useState(() => extractAppPermissions(data?.app))

    const tableData = useMemo(() => {
        const rows: Record<string, RowType> = {}
        for (const [key, value] of Object.entries(appPermissions)) {
            const permissionKey = getPermissionName(key)
            if (!permissionKey) continue
            if (!rows[permissionKey]) {
                rows[permissionKey] = { permission: permissionKey }
            }
            if (key.startsWith(AppEnvironment.Production)) {
                rows[permissionKey].productionKey = key
                rows[permissionKey].productionValue = value
            } else {
                rows[permissionKey].developmentKey = key
                rows[permissionKey].developmentValue = value
            }
        }

        return Object.values(rows)
    }, [appPermissions])

    const columns: Array<TableColumnType<RowType>> = useMemo(() => [
        {
            title: PermissionColumnTitle,
            dataIndex: 'permission',
            key: 'permission',
            width: '50%',
        },
        {
            title: DevelopmentColumnTitle,
            dataIndex: 'developmentValue',
            key: 'development',
            width: 150,
            render (value: boolean | undefined, row) {
                const key = row.developmentKey
                if (typeof value !== 'boolean' || !key) {
                    return null
                }
                return <Checkbox checked={value} onChange={() => setAppPermissions(prev => ({ ...prev, [key]: !value }))}/>
            },
        },
        {
            title: ProductionColumnTitle,
            dataIndex: 'productionValue',
            key: 'production',
            width: 150,
            render (value: boolean | undefined, row) {
                const key = row.productionKey
                if (typeof value !== 'boolean' || !key) {
                    return null
                }
                return <Checkbox checked={value} onChange={() => setAppPermissions(prev => ({ ...prev, [key]: !value }))}/>
            },
        },
    ], [DevelopmentColumnTitle, PermissionColumnTitle, ProductionColumnTitle])

    const onError = useMutationErrorHandler()
    const onCompleted = useMutationCompletedHandler()
    const [updateB2CAppMutation] = useUpdateB2CAppMutation({
        onError,
        onCompleted,
        refetchQueries: [
            {
                query: GetB2CAppDocument,
                variables: { id },
            },
        ],
    })

    const updateB2CApp = useCallback(() => {
        void updateB2CAppMutation({
            variables: {
                id,
                data: { ...appPermissions, dv: 1, sender: getClientSideSenderInfo() },
            },
        })
    }, [id, appPermissions, updateB2CAppMutation])

    return (
        <Section>
            <SubSection title={SectionTitle}>
                <Row gutter={BUTTON_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <Table
                            columns={columns}
                            bordered
                            dataSource={tableData}
                            rowKey='version'
                            pagination={false}
                        />
                    </Col>
                    <Col span={FULL_COL_SPAN}>
                        <Button type='primary' onClick={updateB2CApp}>{SaveActionLabel}</Button>
                    </Col>
                </Row>
            </SubSection>
        </Section>
    )
}