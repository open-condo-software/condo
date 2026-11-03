import { Col, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import React from 'react'

import { Search } from '@open-condo/icons'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { BillingTableFiltersContainer } from '@condo/domains/common/components/BillingTableFiltersContainer'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'


const ROW_GUTTER: [Gutter, Gutter] = [8, 20]

type DatePickerProps = Pick<React.ComponentProps<typeof DateRangePicker>, 'value' | 'onChange' | 'placeholder'>

type PaymentsTableFilterBarProps = {
    search: {
        value: string
        placeholder: string
        onChange: (value: string) => void
    }
    datePickerProps: DatePickerProps
    modalFilters: {
        count: number
        resetButton: React.ReactNode
        openButton: React.ReactNode
    }
}

export const PaymentsTableFilterBar: React.FC<PaymentsTableFilterBarProps> = ({
    search,
    datePickerProps,
    modalFilters,
}) => {
    const { breakpoints } = useLayoutContext()
    const desktopColumnFlex = breakpoints.DESKTOP_SMALL ? 'none' : '100%'

    return (
        <Col span={24}>
            <BillingTableFiltersContainer>
                <Row gutter={ROW_GUTTER} justify={breakpoints.DESKTOP_SMALL ? 'end' : 'start'} align='middle'>
                    <Col flex={breakpoints.DESKTOP_SMALL ? 'auto' : '100%'}>
                        <Input
                            placeholder={search.placeholder}
                            value={search.value}
                            onChange={(event) => search.onChange(event.target.value)}
                            allowClear
                            suffix={<Search size='medium' color={colors.gray[7]} />}
                        />
                    </Col>
                    <Col flex={desktopColumnFlex}>
                        <DateRangePicker {...datePickerProps} />
                    </Col>
                    {modalFilters.count > 0 && (
                        <Col flex={desktopColumnFlex}>
                            {modalFilters.resetButton}
                        </Col>
                    )}
                    <Col flex={desktopColumnFlex}>
                        {modalFilters.openButton}
                    </Col>
                </Row>
            </BillingTableFiltersContainer>
        </Col>
    )
}
