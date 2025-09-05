import { Row, Col } from 'antd'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import React, { useState, useCallback, useMemo, useEffect } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Modal, Typography, List, RadioGroup, Radio, Space, Button, Alert } from '@open-condo/ui'

import { useBankCostItemContext, PropertyReportTypes } from '@condo/domains/banking/components/BankCostItemContext'

import { UpdateSelectedContractors } from './useBankContractorAccountTable'
import { UpdateSelectedTransactions } from './useBankTransactionsTable'

import type {
    BankTransaction as BankTransactionType,
    BankContractorAccount as BankContractorAccountType,
} from '@app/condo/schema'
import type { RowProps } from 'antd'

const CATEGORY_MODAL_ROW_GUTTER: RowProps['gutter'] = [0, 40]

interface IUseCategoryModal {
    ({ bankTransactions, bankContractorAccounts, type }: {
        bankTransactions?: Array<BankTransactionType>
        bankContractorAccounts?: Array<BankContractorAccountType>
        type: PropertyReportTypes
        updateSelected: UpdateSelectedTransactions | UpdateSelectedContractors
    }): {
        CategoryModal: React.ReactElement
        setOpen: React.Dispatch<React.SetStateAction<boolean>>
    }
}

export const useCategoryModal: IUseCategoryModal = ({
    bankTransactions = [], bankContractorAccounts = [], type, updateSelected,
}) => {
    const intl = useIntl()
    const TransactionTitle = intl.formatMessage({ id: 'global.transaction' }, { isSingular: bankTransactions.length === 1 })
    const IncomeTitle = intl.formatMessage({ id: 'global.income' }, { isSingular: false })
    const WithdrawalTitle = intl.formatMessage({ id: 'global.withdrawal' }, { isSingular: false })
    const ContractorTitle = intl.formatMessage({ id: 'global.contractor' }, { isSingular: true })
    const BankAccountTitle = intl.formatMessage({ id: 'global.bankAccount' })
    const ChooseCategoryTitle = intl.formatMessage({ id: 'pages.banking.chooseCategory' })
    const ContractorsSelectedTitle = intl.formatMessage({ id: 'pages.banking.categoryModal.contractorsSelected' })
    const TransactionsSelectedTitle = intl.formatMessage({ id: 'pages.banking.categoryModal.transactionsSelected' })
    const TransactionsWarningTitle = intl.formatMessage({ id: 'pages.banking.categoryModal.transactionsWarning.title' })
    const PaymentPurposeTitle = intl.formatMessage({ id: 'global.paymentPurpose' })
    const SumTitle = intl.formatMessage({ id: 'global.sum' })
    const SaveTitle = intl.formatMessage({ id: 'Save' })

    const { loading, bankCostItemGroups, selectedItem, incomeCostItems, setSelectedItem } = useBankCostItemContext()
    const [open, setOpen] = useState(false)
    const [selectedCostItem, setSelectedCostItem] = useState(null)

    useEffect(() => {
        if (!isNull(selectedItem)) {
            setOpen(true)
        }
    }, [selectedItem])

    const closeModal = useCallback(() => {
        if (!isNull(selectedItem)) {
            setSelectedItem(null)
            setSelectedCostItem(null)
        }
        setOpen(false)
    }, [setSelectedItem, selectedItem])
    const onGroupChange = useCallback((event) => {
        setSelectedCostItem(event.target.value)
    }, [])

    const handleSave = useCallback(async () => {
        const sender = getClientSideSenderInfo()
        const updatePayload = type === 'contractor' ? bankContractorAccounts : bankTransactions

        await updateSelected({
            variables: {
                data: updatePayload.map(updateItem => {
                    return {
                        id: updateItem.id,
                        data: {
                            dv: 1,
                            sender,
                            costItem: { connect: { id: selectedCostItem } },
                        },
                    }
                }),
            },
        })

        setOpen(false)
        setSelectedCostItem(null)
    }, [selectedCostItem, type, bankContractorAccounts, bankTransactions, updateSelected])

    const CategoryModal = useMemo(() => {
        let modalTitle
        let alertDescription
        let totalContractorTransactions = 0
        const listDataSource = []

        if (type === 'income' || type === 'withdrawal') {
            const totalAmount = intl.formatNumber(
                bankTransactions.reduce((prev, current) =>  prev + parseFloat(current.amount), 0),
                { style: 'currency', currency: get(bankTransactions, '0.currencyCode', 'RUB') }
            )

            if (bankTransactions.length === 1) {
                modalTitle = `${TransactionTitle} №${get(bankTransactions, '0.number')}, ${get(bankTransactions, '0.date')}`
                listDataSource.push(
                    { label: PaymentPurposeTitle, value: get(bankTransactions, '0.purpose', '-') },
                    { label: SumTitle, value: totalAmount }
                )
            } else {
                modalTitle = `${TransactionTitle}, ${type === 'income' ? IncomeTitle : WithdrawalTitle}`
                listDataSource.push(
                    { label: TransactionsSelectedTitle, value: bankTransactions.length },
                    { label: SumTitle, value: totalAmount },
                )
            }
        } else if (type === 'contractor') {
            if (bankContractorAccounts.length === 1) {
                modalTitle = `${ContractorTitle} ${get(bankContractorAccounts, '0.name')}`
                totalContractorTransactions = get(bankContractorAccounts, '0.relatedTransactions')

                listDataSource.push({
                    label: BankAccountTitle,
                    value: get(bankContractorAccounts, '0.number'),
                })
            } else {
                listDataSource.push({
                    label: ContractorsSelectedTitle,
                    value: String(bankContractorAccounts.length),
                })
            }

            alertDescription = intl.formatMessage(
                { id: 'pages.banking.categoryModal.transactionsWarning.description' },
                { count: totalContractorTransactions }
            )
        }

        if (!open) {
            return null
        }

        return (
            <Modal
                title={modalTitle}
                open
                onCancel={closeModal}
                width='big'
                scrollX={false}
                footer={<Button
                    type='primary'
                    disabled={isNull(selectedCostItem) || loading}
                    onClick={handleSave}>
                    {SaveTitle}
                </Button>}
            >
                <Row gutter={CATEGORY_MODAL_ROW_GUTTER}>
                    <Col span={24}>
                        <List dataSource={listDataSource} />
                    </Col>
                    {totalContractorTransactions > 0 && (
                        <Col span={24}>
                            <Alert
                                type='warning'
                                message={TransactionsWarningTitle}
                                description={alertDescription}
                                showIcon
                            />
                        </Col>
                    )}
                    <Col span={24}>
                        <Space direction='vertical' size={24}>
                            <Typography.Title level={3}>{ChooseCategoryTitle}</Typography.Title>
                            {type === 'income' ? (
                                <RadioGroup onChange={onGroupChange}>
                                    <Space direction='vertical' size={12}>
                                        {incomeCostItems.map(item => (
                                            <Radio key={item.id} label={item.name} value={item.id} />
                                        ))}
                                    </Space>
                                </RadioGroup>
                            ) : (
                                <RadioGroup
                                    onChange={onGroupChange}
                                >
                                    {bankCostItemGroups.map((group, index) => (
                                        <RadioGroup.ItemGroup
                                            key={`${group.name}-${index}`}
                                            {...group}
                                        />
                                    ))}
                                </RadioGroup>
                            )}
                        </Space>
                    </Col>
                </Row>
            </Modal>
        )
    }, [type, open, closeModal, selectedCostItem, loading, handleSave, SaveTitle, ChooseCategoryTitle, onGroupChange,
        bankCostItemGroups, intl, bankTransactions, TransactionTitle, PaymentPurposeTitle, SumTitle, IncomeTitle,
        WithdrawalTitle, TransactionsSelectedTitle, bankContractorAccounts, ContractorTitle, BankAccountTitle,
        ContractorsSelectedTitle, incomeCostItems, TransactionsWarningTitle])

    return { CategoryModal, setOpen }
}
