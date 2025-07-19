import styled from '@emotion/styled'
import { Col, FormInstance, Row, Tree, TreeProps } from 'antd'
import cloneDeep from 'lodash/cloneDeep'
import difference from 'lodash/difference'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import uniq from 'lodash/uniq'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { MinusCircle, PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Checkbox, Tooltip } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { PermissionRow, PermissionsGroup } from '@condo/domains/organization/hooks/useEmployeeRolesPermissionsGroups'
import { getRelatedPermissionsTranslations } from '@condo/domains/organization/utils/roles.utils'

import { EmployeeRoleFormValuesType } from './BaseEmployeeRoleForm'


const StyledTree = styled(Tree)`
    .ant-tree-checkbox {
        display: none;
    }
    
    .ant-tree-treenode {
        align-items: center;
    }
    
    .ant-tree-node-content-wrapper {
        display: inline-flex;
    }
    
    .ant-tree-title {
        display: inline-flex;
    }
    
    .ant-tree-switcher {
        width: 36px;
        height: 36px;
        align-self: initial;
        
        &.ant-tree-switcher_open .condo-icon-btn-content svg {
            color: ${colors.green[7]}
        }

        .condo-icon-btn {
            width: 100%;
            height: 100%;
        }
    }
`

/*

Form state:
{
    name: 'asd',
    description: 'asd',
    ticketVisibilityType: 'organization',
    permissions: {
        organization: {
            canManageTickets: true,
            canReadTickets: false,
            ...
        },
        b2bApps: {
            <real-b2b-app-id>: {
                canRead<real-b2b-app-id>: true,
                canManageObjects: false,
                ...
            },
            ...
        }
    }
}


Permissions Trees state:
{
    organization: {
        <group-key>: [can<Manage|Read><Schema>s, ...] // only checked
        ...
    },
    b2bApps: {
        <real-b2b-app-id>: [canRead<real-b2b-app-id>, can<Manage|Read><Object>s, ...]  // only checked
        ...
    }
}

 */

type PermissionsFormStateType = {
    organization: EmployeeRoleFormValuesType['permissions']['organization']
    b2bApps: EmployeeRoleFormValuesType['permissions']['b2bApps']
}

type PermissionsTreesStateType = {
    organization: {
        [groupKey: string]: Array<string>
    }
    b2bApps: {
        [groupKey: string]: Array<string>
    }
}

type PermissionsGridPropsType = {
    form: FormInstance<EmployeeRoleFormValuesType>
    permissionsGroups: Array<PermissionsGroup>
    initState: EmployeeRoleFormValuesType['permissions']
    disabled?: boolean
}

const getRoleGroupName = (groupKey) => `roleGroup-${groupKey}`

const convertFormStateToTreesState = (formState: EmployeeRoleFormValuesType['permissions'], permissionsGroups: Array<PermissionsGroup>): PermissionsTreesStateType => permissionsGroups.reduce((acc, group) => {
    const groupKey = group.key
    const b2bAppId = group.b2bAppId
    const groupType = b2bAppId ? 'b2bApps' : 'organization'
    const permissionKeysInGroup = group.permissions.map(permission => permission.key)

    let checkedKeys: Array<string>
    if (groupType === 'b2bApps') {
        checkedKeys = Object.entries(formState.b2bApps[b2bAppId])
            .reduce<Array<string>>((acc, [key, isChecked]) => isChecked ? [...acc, key] : acc, [])
    } else {
        checkedKeys = permissionKeysInGroup
            .reduce<Array<string>>((acc, key) => get(formState, ['organization', key], false) ? [...acc, key] : acc, [])
    }

    const checkedAllKeys = isEqual(permissionKeysInGroup, checkedKeys)
    if (checkedAllKeys) checkedKeys.push(getRoleGroupName(groupKey))

    acc[groupType][getRoleGroupName(groupKey)] = checkedKeys
    return acc
}, { b2bApps: {}, organization: {} })

const PermissionCheckbox = ({ disabled, checked, permissionName, relatedCheckPermissions, relatedUncheckPermissions, roleName }) => {
    const intl = useIntl()
    const relatedCheckPermissionTranslations = useMemo(() => getRelatedPermissionsTranslations(intl, relatedCheckPermissions), [relatedCheckPermissions])
    const relatedUncheckPermissionTranslations = useMemo(() => getRelatedPermissionsTranslations(intl, relatedUncheckPermissions), [relatedUncheckPermissions])
    const RelatedPermissionsOnCheckTitle = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.relatedCheckPermissionsTooltip' }, {
        permissions: relatedCheckPermissionTranslations,
    })
    const RelatedPermissionsOnUncheckTitle = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.relatedUncheckPermissionsTooltip' }, {
        permissions: relatedUncheckPermissionTranslations,
    })

    const [showTooltip, setShowTooltip] = useState<boolean>(false)

    let tooltipTitle

    if (disabled) {
        tooltipTitle = intl.formatMessage({ id: 'pages.condo.employeeRole.tooltip.notEditableRole' }, { role: roleName })
    } else if (checked && !isEmpty(relatedUncheckPermissionTranslations)) {
        tooltipTitle = RelatedPermissionsOnUncheckTitle
    } else if (!checked && !isEmpty(relatedCheckPermissionTranslations)) {
        tooltipTitle = RelatedPermissionsOnCheckTitle
    }

    return (
        <Tooltip
            title={tooltipTitle}
            placement='topLeft'
            open={showTooltip && !!tooltipTitle}

            // @ts-ignore
            overlayStyle={{ pointerEvents: 'none' }}
        >
            <Checkbox
                checked={checked}
                label={permissionName}
                disabled={disabled}

                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            />
        </Tooltip>
    )
}

export const PermissionsGrid: React.FC<PermissionsGridPropsType> = ({
    form,
    permissionsGroups,
    initState,
    disabled,
}) => {
    const [permissionsTreesState, setPermissionsTreesState] = React.useState<PermissionsTreesStateType>(() => convertFormStateToTreesState(initState, permissionsGroups))
    const currentRoleName = useRef(form.getFieldValue('name'))

    const updatePermissionsFormState = useCallback((checkedKeysByGroup: PermissionsTreesStateType, permissionsGroups: Array<PermissionsGroup>) => {
        let organizationPermissions: PermissionsFormStateType['organization'] = {}
        const b2bAppPermissions: PermissionsFormStateType['b2bApps'] = {}

        const prev: PermissionsFormStateType = form.getFieldValue('permissions')

        for (const group of permissionsGroups) {
            const groupKey = group.key
            const b2bAppId = group.b2bAppId
            const permissions = group.permissions
            const checkedKeys = checkedKeysByGroup[b2bAppId ? 'b2bApps' : 'organization'][getRoleGroupName(groupKey)]
            const groupPermissions = {} as { [permissionKey: string]: boolean }

            for (const permission of permissions) {
                const permissionKey = permission.key
                const isCheckedPermissionKey = Array.isArray(checkedKeys) && checkedKeys.includes(permissionKey)
                groupPermissions[permissionKey] = isCheckedPermissionKey

                // ---------- related checkboxes ----------

                const isCheckedPermissionKeyPrev = b2bAppId
                    ? prev['b2bApps'][b2bAppId][permissionKey]
                    : prev['organization'][permissionKey]
                const wasChecked = !isCheckedPermissionKeyPrev && isCheckedPermissionKey
                const wasUnchecked = !isCheckedPermissionKey && isCheckedPermissionKeyPrev

                if (wasChecked && Array.isArray(permission.relatedCheckPermissions)) {
                    for (const relatedPermissionKey of permission.relatedCheckPermissions) {
                        groupPermissions[relatedPermissionKey] = true
                    }
                }

                if (wasUnchecked && Array.isArray(permission.relatedUncheckPermissions)) {
                    for (const relatedPermissionKey of permission.relatedUncheckPermissions) {
                        groupPermissions[relatedPermissionKey] = false
                    }
                }
            }

            if (b2bAppId) {
                b2bAppPermissions[b2bAppId] = groupPermissions
            } else {
                organizationPermissions = {
                    ...organizationPermissions,
                    ...groupPermissions,
                }
            }
        }

        const nextPermissions: PermissionsFormStateType = {
            organization: organizationPermissions,
            b2bApps: b2bAppPermissions,
        }

        form.setFieldValue('permissions', nextPermissions)
    }, [form])

    useDeepCompareEffect(() => {
        updatePermissionsFormState(permissionsTreesState, permissionsGroups)
    }, [permissionsTreesState, permissionsGroups])

    const updatePermissionsTreesState: (groupType: 'b2bApps' | 'organization', groupKey: string, permissions: PermissionRow[]) => TreeProps['onCheck'] =
        useCallback((groupType, groupKey, permissions) =>
            (checkedKeys: Array<string>) => {
                setPermissionsTreesState(prev => {
                    const newState = cloneDeep(prev)
                    newState[groupType][getRoleGroupName(groupKey)] = checkedKeys as Array<string>

                    // ---------- related checkboxes ----------

                    const prevKeys = prev[groupType][getRoleGroupName(groupKey)] || []
                    const addedPerms = difference(checkedKeys as Array<string>, prevKeys)
                    const removedPerms = difference(prevKeys, checkedKeys as Array<string>)
                    const keysToCheck = permissions
                        .filter(perm => addedPerms.includes(perm.key) && perm.relatedCheckPermissions)
                        .flatMap((perm) => perm.relatedCheckPermissions)
                    const keysToUncheck = permissions
                        .filter(perm => removedPerms.includes(perm.key) && perm.relatedUncheckPermissions)
                        .flatMap((perm) => perm.relatedUncheckPermissions)

                    const checkRelatedKeysByGroup = (permissionKeysInGroup: Array<string>, keysToCheck: Array<string>, groupKey: string) => {
                        if (keysToCheck.length > 0) {
                            let newKeys = uniq([
                                ...newState[groupType][getRoleGroupName(groupKey)],
                                ...keysToCheck,
                            ])

                            if (permissionKeysInGroup.every(key => newKeys.includes(key))) {
                                newKeys = uniq([
                                    ...newKeys,
                                    getRoleGroupName(groupKey),
                                ])
                            }
                            newState[groupType][getRoleGroupName(groupKey)] = newKeys
                        }
                    }

                    const uncheckRelatedKeysByGroup = (permissionKeysInGroup: Array<string>, keysToUncheck: Array<string>, groupKey: string) => {
                        let newKeys = newState[groupType][getRoleGroupName(groupKey)].filter(key => !keysToUncheck.includes(key))

                        if (!permissionKeysInGroup.every(key => newKeys.includes(key))) {
                            newKeys = newKeys.filter(key => getRoleGroupName(groupKey) !== key)
                        }

                        newState[groupType][getRoleGroupName(groupKey)] = newKeys
                    }

                    if (groupType === 'organization') {
                        if (keysToCheck.length > 0) {
                            for (const group of permissionsGroups) {
                                const permissions = get(group, 'permissions', [])
                                const permissionKeysInGroup = permissions.map(perm => perm.key as string)
                                const keysToCheckInGroup = permissionKeysInGroup.filter(key => keysToCheck.includes(key))

                                if (keysToCheckInGroup.length < 1) continue

                                checkRelatedKeysByGroup(permissionKeysInGroup, keysToCheckInGroup, group.key)
                            }
                        }
                        if (keysToUncheck.length > 0) {
                            for (const group of permissionsGroups) {
                                const permissions = get(group, 'permissions', [])
                                const permissionKeysInGroup = permissions.map(perm => perm.key as string)
                                const keysToUncheckInGroup = permissionKeysInGroup.filter(key => keysToUncheck.includes(key))

                                if (keysToUncheckInGroup.length < 1) continue

                                uncheckRelatedKeysByGroup(permissionKeysInGroup, keysToUncheckInGroup, group.key)
                            }
                        }
                    } else {
                        const permissionKeysInGroup = permissions.map((permission) => permission.key)

                        if (keysToCheck.length > 0) {
                            checkRelatedKeysByGroup(permissionKeysInGroup, keysToCheck, groupKey)
                        }
                        if (keysToUncheck.length > 0) {
                            uncheckRelatedKeysByGroup(permissionKeysInGroup, keysToUncheck, groupKey)
                        }
                    }

                    return newState
                })
            }, [permissionsGroups])

    const roleGroups = useMemo(() => {
        return permissionsGroups.map(({ key: groupKey, permissions, b2bAppId, groupName }) => {
            const groupType = b2bAppId ? 'b2bApps' : 'organization'
            const checkedKeys = permissionsTreesState[groupType][getRoleGroupName(groupKey)]
            return (
                <Col span={24} sm={12} md={12} xl={8} key={getRoleGroupName(groupKey)}>
                    <StyledTree
                        disabled={disabled}
                        checkable
                        treeData={[{
                            key: getRoleGroupName(groupKey),
                            title: () => {
                                const isAllChecked = Array.isArray(checkedKeys) && checkedKeys.includes(getRoleGroupName(groupKey))
                                const isIndeterminate = Array.isArray(checkedKeys) && checkedKeys.length > 0 && !checkedKeys.includes(getRoleGroupName(groupKey))
                                return (
                                    <Checkbox
                                        checked={isAllChecked}
                                        indeterminate={isIndeterminate}
                                        label={groupName}
                                        labelProps={{ strong: true }}
                                        disabled={disabled}
                                    />
                                )
                            },
                            children: permissions.map(({ key: permissionKey, relatedCheckPermissions, relatedUncheckPermissions, name }) => {
                                const isChecked = Array.isArray(checkedKeys) && checkedKeys.includes(permissionKey)

                                return {
                                    key: permissionKey,
                                    title: () => {
                                        return (
                                            <PermissionCheckbox
                                                disabled={disabled}
                                                checked={isChecked}
                                                permissionName={name}
                                                relatedCheckPermissions={relatedCheckPermissions}
                                                relatedUncheckPermissions={relatedUncheckPermissions}
                                                roleName={currentRoleName.current}
                                            />
                                        )
                                    },
                                }
                            }),
                        }]}
                        selectable={false}
                        checkedKeys={checkedKeys}
                        onCheck={updatePermissionsTreesState(groupType, groupKey, permissions)}
                        switcherIcon={(props) => {
                            const expanded = props.expanded
                            return (
                                <Button.Icon>
                                    {
                                        expanded
                                            ? <MinusCircle size='medium' color={colors.green[7]} />
                                            : <PlusCircle size='medium' />
                                    }
                                </Button.Icon>
                            )
                        }}
                    />
                </Col>
            )
        })
    }, [permissionsGroups, permissionsTreesState, disabled, updatePermissionsTreesState])

    return (
        <>
            <FormItem name='permissions' hidden />
            <Row gutter={[24, 24]}>
                {roleGroups}
            </Row>
        </>
    )
}
