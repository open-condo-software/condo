import { Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import React, { useCallback, useMemo, useState } from 'react'

import { LocaleContext, useIntl } from '@open-condo/next/intl'
import { Button, Modal, Radio, RadioGroup, Space } from '@open-condo/ui'

interface ISettingsPopupContentProps<T> {
    value: T
    onChange: (value: T) => void
}

type TLanguageSettingsModalContentAdditionalProps = {
    possibleLocales: { [locale: string]: string }
}
type TLanguageSettingsResult = string

// Next two types are unions
// TResult = TResult1 | TResult2 ...
// But for now we have only one possible type for each union
type TSettingsItemResult = TLanguageSettingsResult
type TSettingsModalContentAdditionalProps = TLanguageSettingsModalContentAdditionalProps

interface ISettingsTableItem {
    title: string
    valueCell: JSX.Element
    modalContentComponent: React.FC<ISettingsPopupContentProps<TSettingsItemResult>>
    value: TSettingsItemResult
    onChange: { (data: TSettingsItemResult): void }
    props: TSettingsModalContentAdditionalProps
    onSave: { (data: TSettingsItemResult): void }
}

type TCurrentSettingModalData = Omit<ISettingsTableItem, 'valueCell'>

const LanguageSettingPopupContent: React.FC<TLanguageSettingsModalContentAdditionalProps & ISettingsPopupContentProps<TLanguageSettingsResult>> = ({
    value,
    onChange,
    possibleLocales,
}) => {
    return (
        <div>
            <RadioGroup value={value} onChange={(event) => onChange(event.target.value)}>
                <Space direction='vertical' size={12}>
                    {Object.entries(possibleLocales).map(([locale, localeName]) => (
                        <Radio key={`locale=${locale}`} label={localeName} value={locale}/>
                    ))}
                </Space>
            </RadioGroup>
        </div>
    )
}

export const CommonSettingsContent: React.FC = () => {
    const intl = useIntl()
    const RuTitle = intl.formatMessage({ id: 'language.russian.withFlag' })
    const EnTitle = intl.formatMessage({ id: 'language.english-us.withFlag' })
    const SettingNameTitle = intl.formatMessage({ id: 'pages.condo.settings.common.settingName' })
    const SettingValueTitle = intl.formatMessage({ id: 'pages.condo.settings.common.settingValue' })
    const InterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.settings.common.interfaceLanguage' })
    const SaveTitle = intl.formatMessage({ id: 'Save' })

    const [currentSettingModalData, setCurrentSettingModalData] = useState<TCurrentSettingModalData>()

    const possibleLocales = useMemo(() => ({
        ru: RuTitle,
        en: EnTitle,
    }), [EnTitle, RuTitle])

    const handleRowClick = useCallback((row: ISettingsTableItem) => ({
        onClick: () => {
            setCurrentSettingModalData(row)
        },
    }), [])

    const onModalSave = useCallback(() => {
        currentSettingModalData.onSave(currentSettingModalData.value)
        setCurrentSettingModalData(undefined)
    }, [currentSettingModalData])

    const onModalCancel = useCallback(() => setCurrentSettingModalData(undefined), [])

    return (
        <LocaleContext.Consumer>
            {({ locale, setLocale }) => {
                const dataSource: ISettingsTableItem[] = [
                    {
                        title: InterfaceLanguageTitle,
                        valueCell: possibleLocales[locale],
                        modalContentComponent: LanguageSettingPopupContent,
                        onChange: (newLocale) => {
                            setCurrentSettingModalData((prev) => ({ ...prev, value: newLocale }))
                        },
                        value: locale,
                        props: { possibleLocales },
                        onSave: (locale: TLanguageSettingsResult) => {
                            setLocale(locale)
                        },
                    },
                ]

                const columns: ColumnsType<ISettingsTableItem> = [
                    { title: SettingNameTitle, dataIndex: 'title', width: 250 },
                    { title: SettingValueTitle, dataIndex: 'valueCell' },
                ]

                return (
                    <>
                        <Table<ISettingsTableItem>
                            dataSource={dataSource}
                            columns={columns}
                            onRow={handleRowClick}
                            pagination={false}
                            bordered={true}
                        />
                        {!!currentSettingModalData && (
                            <Modal
                                open={!!currentSettingModalData}
                                title={currentSettingModalData.title}
                                onCancel={onModalCancel}
                                footer={<Button type='primary' onClick={onModalSave}>{SaveTitle}</Button>}
                            >
                                <currentSettingModalData.modalContentComponent
                                    value={currentSettingModalData.value}
                                    onChange={currentSettingModalData.onChange}
                                    {...currentSettingModalData.props}
                                />
                            </Modal>
                        )}
                    </>
                )
            }}
        </LocaleContext.Consumer>
    )
}
