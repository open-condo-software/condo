# there are three important things #

 - withApollo
 - withIntl
 - withAuth

You can wrap your App with this helpers!

`pages/_app.js`:
```js
import React from 'react'
import { withApollo } from '@core/next/apollo'
import { withAuth } from '@core/next/auth'
import { withIntl } from '@core/next/intl'

const MyApp = ({ Component, pageProps }) => {
    return (<Component {...pageProps} />)
}

export default withApollo({ ssr: true })(withIntl({ ssr: true, messagesImporter: (locale) => import(`../lang/${locale}`) })(withAuth({ ssr: false })(MyApp)))
```

`Auth` and `Intl` example:
```js
import React from 'react'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'

const SignInPage = () => {
    const intl = useIntl()
    const { signin } = useAuth()

    const SignInMsg = intl.formatMessage({ id: 'SignIn' })

    const clickHandler = () => {
        signin({ variables: {email: 'admin@example.com', password: 'secret'} })
            .then(
                () => {
                    console.log('SIGNED_IN')
                },
                (e) => {
                    console.log(e)
                })
    }

    return (
        <form>
            <button onClick={clickHandler}>{SignInMsg}</button>
        </form>
    )
}

export default SignInPage
```

`Apollo` example:
```js
import React from 'react'
import gql from 'graphql-tag'

const START_PASSWORD_RECOVERY_MUTATION = gql`
    mutation startPasswordRecovery($email: String!){
        status: startPasswordRecovery(email: $email)
    }
`

const RecoveryPage = () => {
    const [startPasswordRecovery] = useMutation(START_PASSWORD_RECOVERY_MUTATION)

    const SignInMsg = intl.formatMessage({ id: 'SignIn' })

    const clickHandler = () => {
        startPasswordRecovery({ variables: {email: 'admin@example.com'} })
            .then(
                () => {
                    console.log('SIGNED_IN')
                },
                (e) => {
                    console.log(e)
                })
    }

    return (
        <form>
            <button onClick={clickHandler}>{SignInMsg}</button>
        </form>
    )
}

export default RecoveryPage
```

## override query ##

If you need a customize GraphQL auth queries, you can do it:
```js
let USER_QUERY = gql`
    query {
        authenticatedUser {
            id name avatar { publicUrl } isAdmin isActive
        }
    }
`

const MyApp = (...) => {...}

export default withApollo({ ssr: true })(withAuth({ ssr: false, USER_QUERY })(MyApp))
```
