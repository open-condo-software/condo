import { Typography } from 'antd'

import CustomLink from '../common/components/CustomLink'
import Translate from '../common/components/Translate'

import { AuthLayout } from "../common/containers";

function HomePage () {
    return (
        <AuthLayout>
            <Typography.Title>
                <Translate id={"pages.index.title"}/>
            </Typography.Title>
            <CustomLink path="/tests/disc">
                <Translate id={"pages.index.apply_test"}/>
            </CustomLink>
        </AuthLayout>
    )
}

export default HomePage
