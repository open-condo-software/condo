import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const EmployeesReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadEmployees']} children={children} />
export const EmployeesReadAndManagePermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadEmployees', 'canManageEmployees']} children={children} />
export const EmployeesReadAndInvitePermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadEmployees', 'canInviteNewOrganizationEmployees']} children={children} />