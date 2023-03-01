import { Table } from 'antd'
import { useCallback, useState } from 'react'

import { LocaleContext, useIntl } from '@open-condo/next/intl'
import { Modal } from '@open-condo/ui'

const LanguageSettingPopupContent = ({ locale, setLocale }): JSX.Element => {
    const intl = useIntl()
    // const RuTitle = intl.formatMessage({ id: '' })
    // const EnTitle = intl.formatMessage({ id: '' })

    return (
        <div>
            <button onClick={() => setLocale('ru')}>{locale === 'ru' ? 'RU' : 'ru'}</button>
            <button onClick={() => setLocale('en')}>{locale === 'en' ? 'EN' : 'en'}</button>
        </div>
    )
}

export const CommonSettingsContent = (): JSX.Element => {
    const intl = useIntl()
    const SettingNameTitle = intl.formatMessage({ id: 'pages.condo.settings.common.settingName' })
    const SettingValueTitle = intl.formatMessage({ id: 'pages.condo.settings.common.settingValue' })
    const InterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.settings.common.interfaceLanguage' })

    const [modalContent, setModalContent] = useState<JSX.Element>()

    const handleRowClick = useCallback((row) => {
        return {
            onClick: () => {
                setModalContent(row.modalContent)
            },
        }
    }, [])

    return (
        <LocaleContext.Consumer>
            {({ locale, setLocale }) => {
                const dataSource = [
                    {
                        title: InterfaceLanguageTitle,
                        value: <div>{locale}</div>,
                        modalContent: <LanguageSettingPopupContent locale={locale} setLocale={setLocale}/>,
                    },
                ]
                const columns = [
                    { title: SettingNameTitle, dataIndex: 'title', width: 250 },
                    { title: SettingValueTitle, dataIndex: 'value' },
                ]

                return (
                    <>
                        <Table
                            dataSource={dataSource}
                            columns={columns}
                            onRow={handleRowClick}
                        />
                        <Modal title='123' open={!!modalContent} onCancel={() => setModalContent(undefined)}>
                            {modalContent}
                        </Modal>
                    </>
                )
            }}
        </LocaleContext.Consumer>
    )
}
