import Head from "next/head"
import {Typography, Input, Divider, Tooltip, Descriptions} from "antd"
import {PageContent, PageHeader, PageWrapper} from "@app/_example05app/containers/BaseLayout"
import {AuthRequired} from "@app/_example05app/containers/AuthRequired"
import {useRouter} from "next/router"
import {useQuery} from "@core/next/apollo"
import gql from "graphql-tag"

console.log(gql);

const Signature = ({signature}) => {
    const parsed_signature = JSON.parse(signature);

    return (
        <div>
            <Descriptions.Item label="name">{parsed_signature.name}</Descriptions.Item>
            <Descriptions.Item label="args">{parsed_signature.arguments.map(({name, type}) => (`${name}:${type};`)).join(", ")}</Descriptions.Item>
            <Descriptions.Item label="return">{parsed_signature.return}</Descriptions.Item>
        </div>
    )
};

const FUNCTION_QUERY = gql`
    query getFunctionById($id: ID!){
        allFunctions(where: {id: $id}) {
            id
            signature
            description
        }
    }
`

const FunctionPage = () => {
    const router = useRouter();
    const { function_id } = router.query;
    const { data } = useQuery(FUNCTION_QUERY, {variables: {id: function_id}});

    if (!data || !data.allFunctions.length) {
        return null;
    }

    return (
        <>
            <Head>
                <title>{function_id}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={`Описание ${function_id}`}/>
                <PageContent>
                    <AuthRequired>
                        <div>
                            <Typography.Title level={2}>{function_id}</Typography.Title>
                            <Typography.Paragraph>{data.allFunctions[0].description}</Typography.Paragraph>
                            <Divider/>
                            <Descriptions>
                                <Descriptions.Item label="Сигнатура функции">
                                    <Signature signature={data.allFunctions[0].signature}/>
                                </Descriptions.Item>
                                <Descriptions.Item label="Исходный код функции">Cloud Database</Descriptions.Item>
                            </Descriptions>
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
                        </div>
                    </AuthRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default FunctionPage
