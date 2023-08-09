import { Organization } from '@app/condo/schema'
import get from 'lodash/get'

import { LogoSBBOL } from '@open-condo/icons'

import { UUID_REGEXP } from '@condo/domains/common/constants/regexps'
import { SBBOL_IMPORT_NAME } from '@condo/domains/organization/integrations/sbbol/constants'


type SBBOLIndicatorProps = {
    organization: Organization
}

export const SBBOLIndicator: React.FC<SBBOLIndicatorProps> = ({ organization }) => {
    const importRemoteSystem = get(organization, 'importRemoteSystem')
    const importId = get(organization, 'importId')

    if (importRemoteSystem !== SBBOL_IMPORT_NAME || !UUID_REGEXP.test(importId)) return null

    return <LogoSBBOL />
}