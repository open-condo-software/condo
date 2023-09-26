import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const ContactsReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadContacts']} children={children} />
export const ContactsReadAndManagePermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadContacts', 'canManageContacts']} children={children} />
