/**
 * Condo currently supports two UIs for news sharing:
 * 1. BaseNewsForm – ui with support of cross posting functionality
 * 2. OldBaseNewsForm - legacy ui without support of cross posting functionality
 * TODO (DOMA-9331) Remove this component and OldBaseNewsForm
 *
 * Note on templates:
 * On BaseNewsForm (new UI) templates come from environment.
 * TODO (DOMA-9331) Remove this component and OldBaseNewsForm
 *
 * Note: OldBaseNewsForm was slightly modified to support new API of NewsPreview component, as well as few other minor changes
 */

import getConfig from 'next/config'
import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { NEWS_SHARING } from '@condo/domains/common/constants/featureflags'
import { BaseNewsFormProps, BaseNewsForm } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { OldBaseNewsForm } from '@condo/domains/news/components/NewsForm/OldBaseNewsForm'
const {
    publicRuntimeConfig,
} = getConfig()

const { newsTemplates } = publicRuntimeConfig

export const BaseNewsFormByFeatureFlag: React.FC<BaseNewsFormProps> = (
    props
) => {
    const { useFlag } = useFeatureFlags()
    const isNewsSharingEnabled = useFlag(NEWS_SHARING)

    if (isNewsSharingEnabled) {

        const newProps = {
            ...props,
            templates: newsTemplates,
        }

        return <BaseNewsForm
            {...newProps}
        />
    } else {
        return <OldBaseNewsForm
            {...props}
        />
    }
}