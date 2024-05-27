import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const SettingsReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadSettings']} children={children} />