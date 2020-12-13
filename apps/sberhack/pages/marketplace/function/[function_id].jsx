import Head from "next/head"
import {Typography, Input, Divider, Tooltip, Descriptions} from "antd"
import {PageContent, PageHeader, PageWrapper} from "@app/_example05app/containers/BaseLayout"
import {AuthRequired} from "@app/_example05app/containers/AuthRequired"
import {useRouter} from "next/router"
import {useQuery} from "@core/next/apollo"
import gql from "graphql-tag"
import {PaymentModal} from "./PaymentModal";
import dynamic from "next/dynamic";

const FUNCTION_QUERY = gql`
    query getFunctionById($id: ID!){
        allFunctions(where: {id: $id}) {
            markerplaceName
            id
            signature
            description
            body
        }
    }
`

const FunctionPage = () => {
    const router = useRouter();
    const { function_id } = router.query;
    const { data } = useQuery(FUNCTION_QUERY, {variables: {id: function_id}});
    const function_data = data?.allFunctions[0]

    if (!function_data) {
        return null;
    }

    console.log(function_data);

    return (
        <>
            <Head>
                <title>{function_data.markerplaceName}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={"Описание"}/>
                <PageContent>
                    <AuthRequired>
                        <div>
                            <Typography.Title level={2}>{function_data.markerplaceName}</Typography.Title>
                            <Typography.Paragraph>{function_data.description}</Typography.Paragraph>
                            <Divider/>
                            <Typography.Title level={4}>Попробуй вызвать</Typography.Title>
                            <Tooltip
                                trigger={['focus']}
                                title={"Введите аргументы функции через запятую"}
                                placement="topLeft"
                                overlayClassName="numeric-input"
                            >
                                <Input
                                    placeholder="Введите аргументы функции через запятую"
                                    maxLength={25}
                                />
                            </Tooltip>
                            <Divider/>
                            <PaymentModal function_data={function_data}/>
                        </div>
                    </AuthRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default FunctionPage
