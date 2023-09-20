import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const TicketReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadTickets']} children={children} />
export const TicketReadAndManagePermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadTickets', 'canManageTickets']} children={children} />