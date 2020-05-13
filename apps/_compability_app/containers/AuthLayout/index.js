import { AuthContext } from '../../lib/auth'
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import Translate from '../../components/Translate'
import PageLoader from './PageLoader'


export function AuthLayout({ children }) {
    return (
        <AuthContext.Consumer>
            {
                ({isAuthenticated, isLoading}) => {
                    if (isLoading) {
                        return (<PageLoader/>)
                    }

                    if (!isAuthenticated) {
                        return <Translate id={"PageUnavailable"}/>
                    }

                    return children
                }
            }
        </AuthContext.Consumer>
    )
}
