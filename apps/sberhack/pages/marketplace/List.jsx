import { List } from "antd"
import { Card } from "./Card"
import gql from "graphql-tag"
import {useQuery} from "@core/next/apollo";

const FUNCTION_LIST_QUERY = gql`
    query {
        allFunctions {
            id
            owner {
                id
                name
            }
            signature
            description
            markerplaceName
            body
        }
    }
`

const grid_options = {
    gutter: 16,
    xs: 1,
    sm: 2,
    md: 4,
    lg: 4,
    xl: 6,
    xxl: 3,
};

export const ItemList = () => {
    const { loading, data } = useQuery(FUNCTION_LIST_QUERY);

    return (
        <List
            grid={grid_options}
            dataSource={data && data.allFunctions || []}
            renderItem={(item) => <Card item={item}/>}
        />
    )
};
