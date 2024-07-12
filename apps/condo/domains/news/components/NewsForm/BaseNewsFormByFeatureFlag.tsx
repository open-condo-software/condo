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
import keyBy from 'lodash/keyBy'
import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'

import { NEWS_SHARING, NEWS_SHARING_TEMPLATES } from '@condo/domains/common/constants/featureflags'
import { BaseNewsFormProps, BaseNewsForm } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { OldBaseNewsForm } from '@condo/domains/news/components/NewsForm/OldBaseNewsForm'

export const BaseNewsFormByFeatureFlag: React.FC<BaseNewsFormProps> = (
    props
) => {
    const intl = useIntl()
    const EmptyTemplateTitle = intl.formatMessage({ id: 'news.fields.emptyTemplate.title' })

    const { useFlag, useFlagValue } = useFeatureFlags()
    const isNewsSharingEnabled = useFlag(NEWS_SHARING)
    let newsSharingTemplates: Array<{ id: string, type: unknown, body: string, title: string, label?: string, category?: string }> = useFlagValue(NEWS_SHARING_TEMPLATES)

    if (!Array.isArray(newsSharingTemplates)) {
        newsSharingTemplates = []
    }

    // Since OldBaseNewsItemForm.tsx supports only object instaed of array, we should make these transitions
    // Todo (DOMA-9331) @toplenboren remove OldBaseNewsItemForm.tsx
    const newTemplates = {
        emptyTemplate: { category: '', label: EmptyTemplateTitle, title: '', body: '', type: null },
        ...keyBy(newsSharingTemplates, 'id'),
    }

    if (isNewsSharingEnabled) {
        const newProps = {
            ...props,
            templates: newTemplates,
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