import { IntlShape } from 'react-intl/src/types'


type GetRelatedPermissionsTranslations = (intl: IntlShape, relatedPermissions: Array<string>) => string

export const getRelatedPermissionsTranslations: GetRelatedPermissionsTranslations = (intl, relatedPermissions) => (relatedPermissions || [])
    .map(key => {
        const translationKey = `pages.condo.settings.employeeRoles.permission.${key}` as FormatjsIntl.Message['ids']
        const translation = intl.formatMessage({ id: translationKey })

        if (translation === translationKey) return

        return `«${translation}»`
    })
    .filter(Boolean)
    .join(', ')
