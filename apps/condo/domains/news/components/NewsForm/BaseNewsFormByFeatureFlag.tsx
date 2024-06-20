/**
 * Condo currently supports two UIs for news sharing:
 * 1. BaseNewsForm – ui with support of cross posting functionality
 * 2. OldBaseNewsForm - legacy ui without support of cross posting functionality
 * TODO (DOMA-9331) Remove this component and OldBaseNewsForm
 *
 * Note: OldBaseNewsForm was slightly modified to support new API of NewsPreview component, as well as few other minor changes
 */

import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { NEWS_SHARING } from '@condo/domains/common/constants/featureflags'
import { BaseNewsFormProps, BaseNewsForm } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { OldBaseNewsForm } from '@condo/domains/news/components/NewsForm/OldBaseNewsForm'

export const BaseNewsFormByFeatureFlag: React.FC<BaseNewsFormProps> = (
    props
) => {
    const { useFlag } = useFeatureFlags()
    const isNewsSharingEnabled = useFlag(NEWS_SHARING)

    if (isNewsSharingEnabled) {
        return <BaseNewsForm
            {...props}
        />
    } else {
        return <OldBaseNewsForm
            {...props}
        />
    }
}