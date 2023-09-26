import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const NewsReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadNewsItems']} children={children} />
export const NewsReadAndManagePermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadNewsItems', 'canManageNewsItems']} children={children} />
