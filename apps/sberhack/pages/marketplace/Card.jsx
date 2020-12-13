import styled from "@emotion/styled";
import {Divider, List, Typography} from "antd"
import { useRouter } from "next/router"

const Container = styled.div`
    padding: 20px;
    border-radius: 10px;
    background-color: #fff;
    cursor: pointer;
`

const Wrapper = styled.div`
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    height: 100px;  
`

export const Card = ({ item }) => {
    const router = useRouter();
    const { markerplaceName, owner, id, description } = item;

    return (
        <List.Item onClick={() => {
            router.push(`/marketplace/function/${id}`)
        }}>
            <Container>
                <Typography.Title level={5}>
                    {markerplaceName}
                </Typography.Title>
                <Wrapper>
                    {description}
                </Wrapper>
                <Divider/>
                <Typography.Link href="#">{owner.name}</Typography.Link>
            </Container>
        </List.Item>
    )
}
