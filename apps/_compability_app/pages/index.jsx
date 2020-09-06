import { Typography } from 'antd'

import CustomLink from '../common/components/CustomLink'
import Translate from '../common/components/Translate'

function HomePage () {
    return (
        <div>
            <Typography.Title>
                <Translate id={"pages.index.title"}/>
            </Typography.Title>
            <CustomLink path="/tests/disc">
                <Translate id={"pages.index.apply_test"}/>
            </CustomLink>
        </div>
    )
}

export default HomePage
