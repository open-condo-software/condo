import { Divider, Table } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { Checkbox, Typography } from '@open-condo/ui'


import { Spin } from '@/domains/common/components/Spin'
import { SHOWED_PERMISSIONS } from '@/domains/miniapp/constants/b2bAppAccessRightSet'

import type { ShowedPermissions } from '@/domains/miniapp/constants/b2bAppAccessRightSet'
import type { TableColumnType } from 'antd'
import type { CSSProperties } from 'react'

import {
    AppEnvironment,
    B2BAppAccessRightSetStatusType,
    useGetB2BAppAccessRightSetsForAppQuery,
} from '@/gql'

type AccessRightSetFormProps = {
    id: string
    environment: AppEnvironment
}

type RowType = {
    permission: keyof ShowedPermissions
    value: boolean
}

const DIVIDER_STYLES: CSSProperties = { marginBottom: 24 }

export const AccessRightSetForm: React.FC<AccessRightSetFormProps> = ({ id, environment }) => {
    const intl = useIntl()
    const FormSectionTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.title' })
    const PermissionColumnTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.table.columns.permission.title' })
    const { persistor } = useCachePersistor()
    const [permissions, setPermissions] = useState<ShowedPermissions>(() => Object.fromEntries(SHOWED_PERMISSIONS.map(p => [p, false])) as ShowedPermissions)

    const { data, loading } = useGetB2BAppAccessRightSetsForAppQuery({
        variables: {
            appId: id,
            environment,
        },
        skip: !persistor,
    })

    const appRightSets = useMemo(() => data?.rightSets ?? [], [data?.rightSets])
    const pendingRightSet = useMemo(() => appRightSets.find((rightSet) => rightSet?.status === B2BAppAccessRightSetStatusType.Pending && rightSet?.environment === environment), [appRightSets, environment])
    const approvedRightSet = useMemo(() => appRightSets.find((rightSet) => rightSet?.status === B2BAppAccessRightSetStatusType.Approved && rightSet?.environment === environment), [appRightSets, environment])
    const currentRightSet = useMemo(() => pendingRightSet ?? approvedRightSet, [approvedRightSet, pendingRightSet])

    useEffect(() => {
        if (currentRightSet) {
            setPermissions(
                Object.fromEntries(SHOWED_PERMISSIONS.map(p => [p, currentRightSet?.[p] ?? false])) as ShowedPermissions
            )
        }
    }, [currentRightSet])

    const columns: Array<TableColumnType<RowType>> = useMemo(() => [
        {
            title: PermissionColumnTitle,
            dataIndex: 'permission',
            key: 'permission',
            width: '75%',
            // render (value: string) {
            //     // return <PermissionText permission={value}/>
            // },
        },
        {
            title: '',
            dataIndex: 'value',
            key: 'value',
            width: 50,
            align: 'center',
            render (value: boolean | undefined, row) {
                const key = row.permission
                if (typeof value !== 'boolean' || !key) {
                    return null
                }
                return <Checkbox checked={value} onChange={() => setPermissions(prev => ({ ...prev, [key]: !value }))}/>
            },
        },
    ], [PermissionColumnTitle])

    const dataSource = useMemo(() => (Object.entries(permissions).map(([permission, value]) => ({
        permission,
        value,
    })) as Array<RowType>), [permissions])


    return (
        <>
            <Divider orientation='left' orientationMargin={0} style={DIVIDER_STYLES}>
                <Typography.Title level={4}>
                    {FormSectionTitle}
                </Typography.Title>
            </Divider>
            {loading && <Spin size='large'/>}
            {!loading && (
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    bordered
                    rowKey='permission'
                    pagination={false}
                />
            )}
        </>
    )
}