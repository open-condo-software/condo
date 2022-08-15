import { Tooltip } from 'antd'
import { TooltipPlacement } from 'antd/es/tooltip'
import React from 'react'
import { useIntl } from 'react-intl'

export interface INoOrganizationToolTipWrapper {
    element: JSX.Element,
    placement: TooltipPlacement,
}

interface INoOrganizationToolTipHook {
    wrapElementIntoNoOrganizationToolTip: (params: INoOrganizationToolTipWrapper) => JSX.Element
}

export const useNoOrganizationToolTip = (): INoOrganizationToolTipHook => {
    const intl = useIntl()
    const CreateOrgWarning = intl.formatMessage({ id: 'onboarding.step.warn.create.Organization' })

    const wrapElementIntoNoOrganizationToolTip = (params: INoOrganizationToolTipWrapper): JSX.Element => {
        return (
            <Tooltip
                title={CreateOrgWarning}
                placement={params.placement}
                trigger='click'
            >
                {params.element}
            </Tooltip>
        )
    }

    return { wrapElementIntoNoOrganizationToolTip }
}