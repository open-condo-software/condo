import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const SettingsReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadSettings']} children={children} />
export const MarketSettingReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadMarketSetting']} children={children} />
export const EmployeeRolesReadAndManagePermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadSettings', 'canManageRoles']} children={children} />