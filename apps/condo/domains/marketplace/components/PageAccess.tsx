import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const InvoiceReadPermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadInvoices']} children={children} />
export const InvoiceReadAndManagePermissionRequired = ({ children }) => <PermissionsRequired permissionKeys={['canReadInvoices', 'canManageInvoices']} children={children} />