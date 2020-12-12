import styled from "@emotion/styled";
import {Divider, List, Typography} from "antd";
import { useRouter } from 'next/router'

const Container = styled.div`
    padding: 20px;
    border-radius: 10px;
    background-color: #fff;
    cursor: pointer;
`

export const Card = ({ item }) => {
    const router = useRouter();
    const { marketplace_name, owner, id, description } = item;

    return (
        <Container onClick={() => {
            router.push(`/marketplace/function/${id}`)
        }}>
            <List.Item>
                <Container>
                    <Typography.Title level={5}>
                        {marketplace_name}
                    </Typography.Title>
                    {description}
                    <Divider/>
                    <Typography.Link href="#">{owner.name}</Typography.Link>
                </Container>
            </List.Item>
        </Container>
    )
}
