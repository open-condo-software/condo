import { TooltipPlacement } from 'antd/es/tooltip'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Tooltip } from '@condo/domains/common/components/Tooltip'


export interface INoOrganizationToolTipWrapper {
    key?: string,
    element: JSX.Element,
    placement: TooltipPlacement,
}

interface INoOrganizationToolTipHook {
    wrapElementIntoNoOrganizationToolTip: (params: INoOrganizationToolTipWrapper) => JSX.Element
}

export const useNoOrganizationToolTip = (): INoOrganizationToolTipHook => {
    const intl = useIntl()
    const CreateOrgWarning = intl.formatMessage({ id: 'onboarding.step.warn.create.organization' })

    const wrapElementIntoNoOrganizationToolTip = (params: INoOrganizationToolTipWrapper): JSX.Element => {
        return (
            <Tooltip
                key={params.key}
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