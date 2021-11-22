/** @jsx jsx */
import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { Row, Col, RowProps } from 'antd'
import { css, jsx } from '@emotion/core'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import CreatePropertyMapForm from '@condo/domains/property/components/PropertyMapForm/CreatePropertyMapForm'
import { colors } from '@condo/domains/common/constants/style'

const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]

const PropertyMapRowCss = css`
  & div::-webkit-scrollbar {
    width: 14px;
    border-right: 5px solid transparent;
  }
  & div::-webkit-scrollbar-thumb {
    background-color: ${colors.inputBorderHover};
    border-radius: 100px;
    border: 4px solid rgba(0, 0, 0, 0);
    background-clip: padding-box;
    width: 5px;
  }
  & div::-webkit-scrollbar-track {
    background-color: transparent;
    border-radius: 100px;
  }
`

const CreatePropertyMapPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyTitle' })
    const { query: { id } } = useRouter()

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={PAGE_ROW_GUTTER} css={PropertyMapRowCss}>
                        <Col span={24}>
                            <CreatePropertyMapForm id={id as string} />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreatePropertyMapPage.requiredAccess = OrganizationRequired

export default CreatePropertyMapPage
