import { Organization } from '@app/condo/schema'
import get from 'lodash/get'

import { IconProps, Sber } from '@open-condo/icons'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { UUID_REGEXP } from '@condo/domains/common/constants/regexps'
import { colors } from '@condo/domains/common/constants/style'
import { SBBOL_IMPORT_NAME } from '@condo/domains/organization/integrations/sbbol/constants'

type SBBOLIndicatorProps = {
    organization: Organization
    size?: IconProps['size']
}

export const SBBOLIndicator: React.FC<SBBOLIndicatorProps> = ({ organization }) => {
    const { breakpoints } = useLayoutContext()

    const importRemoteSystem = get(organization, 'importRemoteSystem')
    const importId = get(organization, 'importId')

    if (importRemoteSystem !== SBBOL_IMPORT_NAME || !UUID_REGEXP.test(importId)) return null

    const size = breakpoints.TABLET_LARGE ? 'large' : 'small'

    return (
        <Sber color={colors.sberDarkGreen} size={size}/>
    )
}