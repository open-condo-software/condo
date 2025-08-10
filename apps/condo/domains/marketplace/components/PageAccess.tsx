import React from 'react'

import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'

export const MarketplaceReadPermissionRequired: React.FC<React.PropsWithChildren> = ({ children }) => <PermissionsRequired permissionKeys={['canReadMarketplace']} children={children} />
export const MarketplaceSetupPermissionRequired: React.FC<React.PropsWithChildren> = ({ children }) => <PermissionsRequired permissionKeys={['canManageMarketplace']} children={children} />

export const InvoiceReadPermissionRequired: React.FC<React.PropsWithChildren> = ({ children }) => <PermissionsRequired permissionKeys={['canReadInvoices']} children={children} />
export const InvoiceReadAndManagePermissionRequired: React.FC<React.PropsWithChildren> = ({ children }) => <PermissionsRequired permissionKeys={['canReadInvoices', 'canManageInvoices']} children={children} />

export const MarketItemReadPermissionRequired: React.FC<React.PropsWithChildren> = ({ children }) => <PermissionsRequired permissionKeys={['canReadMarketItems']} children={children} />
export const MarketItemReadAndManagePermissionRequired: React.FC<React.PropsWithChildren> = ({ children }) => <PermissionsRequired permissionKeys={['canReadMarketItems', 'canManageMarketItems']} children={children} />