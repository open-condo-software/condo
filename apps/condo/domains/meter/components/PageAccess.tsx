import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const MeterReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadMeters']} children={children} />
export const MeterReadAndManagePermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadMeters', 'canManageMeters']} children={children} />
