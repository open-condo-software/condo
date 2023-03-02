import { Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import React, { useCallback, useState } from 'react'

import { LocaleContext, useIntl } from '@open-condo/next/intl'
import { Modal } from '@open-condo/ui'

interface ISettingsItem {
    title: string
    value: JSX.Element
    modalContent: JSX.Element
}

interface ISettingsModal {
    title: string
    content: JSX.Element
}

interface ILanguageNameProps {
    locale: string
    useFlag?: boolean
}

const LanguageName: React.FC<ILanguageNameProps> = ({ locale, useFlag = true }) => {
    const intl = useIntl()
    const RuTitle = intl.formatMessage({ id: 'language.russian' })
    const EnTitle = intl.formatMessage({ id: 'language.english-us' })

    // todo(AleX83Xpert) maybe move languages to some global place
    const possible: { [locale: string]: { title: string, flagEmoji: string } } = {
        ru: { title: RuTitle, flagEmoji: '🇷🇺' },
        en: { title: EnTitle, flagEmoji: '🇺🇸' },
    }

    return (
        <>
            {useFlag && `${possible[locale].flagEmoji}\u00a0`}
            {possible[locale].title}
        </>
    )
}

interface ILanguageSettingPopupContentProps {
    locale: string
    setLocale: { (locale: string): void }
}

const LanguageSettingPopupContent: React.FC<ILanguageSettingPopupContentProps> = ({ locale, setLocale }) => {
    return (
        <div>
            <button onClick={() => setLocale('ru')}>{locale === 'ru' ? 'RU' : 'ru'}</button>
            <button onClick={() => setLocale('en')}>{locale === 'en' ? 'EN' : 'en'}</button>
        </div>
    )
}

export const CommonSettingsContent: React.FC = () => {
    const intl = useIntl()
    const SettingNameTitle = intl.formatMessage({ id: 'pages.condo.settings.common.settingName' })
    const SettingValueTitle = intl.formatMessage({ id: 'pages.condo.settings.common.settingValue' })
    const InterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.settings.common.interfaceLanguage' })

    const [modalContent, setModalContent] = useState<ISettingsModal>()

    const handleRowClick = useCallback((row: ISettingsItem) => {
        return {
            onClick: () => {
                setModalContent({ content: row.modalContent, title: row.title })
            },
        }
    }, [])

    return (
        <LocaleContext.Consumer>
            {({ locale, setLocale }) => {
                const dataSource: ISettingsItem[] = [
                    {
                        title: InterfaceLanguageTitle,
                        value: <LanguageName locale={locale}/>,
                        modalContent: <LanguageSettingPopupContent locale={locale} setLocale={setLocale}/>,
                    },
                ]
                const columns: ColumnsType<ISettingsItem> = [
                    { title: SettingNameTitle, dataIndex: 'title', width: 250 },
                    { title: SettingValueTitle, dataIndex: 'value' },
                ]

                return (
                    <>
                        <Table<ISettingsItem>
                            dataSource={dataSource}
                            columns={columns}
                            onRow={handleRowClick}
                            pagination={false}
                            bordered={true}
                        />
                        {!!modalContent && (
                            <Modal
                                title={modalContent.title}
                                open={!!modalContent}
                                onCancel={() => setModalContent(undefined)}
                            >
                                {modalContent.content}
                            </Modal>
                        )}
                    </>
                )
            }}
        </LocaleContext.Consumer>
    )
}
