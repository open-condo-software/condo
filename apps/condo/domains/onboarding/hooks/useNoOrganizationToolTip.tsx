import { TooltipPlacement } from 'antd/es/tooltip'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tooltip } from '@open-condo/ui'


export interface INoOrganizationToolTipWrapper {
    key?: string
    element: JSX.Element
    placement: TooltipPlacement
}

interface INoOrganizationToolTipHook {
    wrapElementIntoNoOrganizationToolTip: (params: INoOrganizationToolTipWrapper) => JSX.Element
}

export const useNoOrganizationToolTip = (): INoOrganizationToolTipHook => {
    const intl = useIntl()
    const CreateOrgWarning = intl.formatMessage({ id: 'global.warns.createOrganization' })
    const [isTooltipOpen, setIsTooltipOpen] = useState(false)

    const handleToggleTooltip = useCallback(() => {
        setIsTooltipOpen((prevState) => !prevState)
    }, [])

    const handleTooltipOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setIsTooltipOpen(false)
        }
    }, [])

    const wrapElementIntoNoOrganizationToolTip = (params: INoOrganizationToolTipWrapper): JSX.Element => {
        return (
            <Tooltip
                key={params.key}
                title={CreateOrgWarning}
                placement={params.placement}
                open={isTooltipOpen}
                onOpenChange={handleTooltipOpenChange}
            >
                <span onClick={handleToggleTooltip}>
                    {params.element}
                </span>
            </Tooltip>
        )
    }

    return { wrapElementIntoNoOrganizationToolTip }
}
