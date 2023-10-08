import { Row, Col } from 'antd'
import get from 'lodash/get'
import React from 'react'

import { Alert, ActionBar } from '@open-condo/ui'


import { useBillingAndAcquiringContexts } from './ContextProvider'
import { ReceiptsTable } from './ReceiptsTable'
import { ReportMessage } from './ReportMessage'

import type { RowProps } from 'antd'

const FULL_SPAN = 24
const SECTION_GUTTER: RowProps['gutter'] = [40, 40]

type AccrualsTabProps = {
    uploadComponent?: React.ReactElement
}

export const AccrualsTab: React.FC<AccrualsTabProps> = ({ uploadComponent }) => {
    const { billingContext } = useBillingAndAcquiringContexts()
    const problem = get(billingContext, 'currentProblem')

    return (
        <Row gutter={SECTION_GUTTER}>
            <Col span={FULL_SPAN}>
                <ReportMessage/>
            </Col>
            {Boolean(problem) && (
                <Col span={FULL_SPAN}>
                    <Alert type='error' message={problem.title} description={problem.message} showIcon/>
                </Col>
            )}
            <Col span={FULL_SPAN}>
                <ReceiptsTable/>
            </Col>
            {Boolean(uploadComponent) && (
                <Col span={FULL_SPAN}>
                    <ActionBar actions={[uploadComponent]}/>
                </Col>
            )}
        </Row>
    )
}