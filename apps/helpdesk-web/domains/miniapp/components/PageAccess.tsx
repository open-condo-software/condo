import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const ServicesReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadServices']} children={children} />