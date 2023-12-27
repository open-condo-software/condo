import React from 'react'

import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const MarketplaceReadPermissionRequired: React.FC = ({ children }) => <PermissionsRequired permissionKeys={['canReadMarketplace']} children={children} />
export const MarketplaceSetupPermissionRequired: React.FC = ({ children }) => <PermissionsRequired permissionKeys={['canManageMarketplace']} children={children} />

export const InvoiceReadPermissionRequired: React.FC = ({ children }) => <PermissionsRequired permissionKeys={['canReadInvoices']} children={children} />
export const InvoiceReadAndManagePermissionRequired: React.FC = ({ children }) => <PermissionsRequired permissionKeys={['canReadInvoices', 'canManageInvoices']} children={children} />

export const MarketItemReadPermissionRequired: React.FC = ({ children }) => <PermissionsRequired permissionKeys={['canReadMarketItems']} children={children} />
export const MarketItemReadAndManagePermissionRequired: React.FC = ({ children }) => <PermissionsRequired permissionKeys={['canReadMarketItems', 'canManageMarketItems']} children={children} />