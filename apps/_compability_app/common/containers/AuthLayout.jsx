import {useEffect} from "react";
import {useAuth} from '@core/next/auth'
import Router from "next/router";

import Translate from '../components/Translate'
import PageLoader from '../components/PageLoader'

export function AuthLayout({ children, redirect }) {
    const {isAuthenticated, isLoading} = useAuth();

    useEffect(() => {
        if (!isAuthenticated && redirect) {
            Router.push("/auth/signin")
        }
    }, [isAuthenticated]);

    if (isLoading) {
        return (<PageLoader/>)
    }

    if (!isAuthenticated) {
        return <Translate id={"PageUnavailable"}/>
    }

    return children
}
