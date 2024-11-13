import { ConfigProvider as BaseConfigProvider } from 'antd'
import { ConfigProviderProps } from 'antd/lib/config-provider'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'

import { useIntl } from '@open-condo/next/intl'

const ANT_DEFAULT_LOCALE = enUS
const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

const ConfigProvider = (props: ConfigProviderProps) => {
    const intl = useIntl()
    // NOTE(pahaz): https://github.com/ant-design/ant-design/blob/4.24.12/components/locale/ru_RU.tsx
    // TODO(pahaz): DOMA-10627 move this translations to locale
    const locale = ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE
    const baseConfigProviderProps: ConfigProviderProps = {
        componentSize: 'large',
        locale,
        ...props,
    }
    return <BaseConfigProvider {...baseConfigProviderProps} />
}

export default ConfigProvider
