import React from "react";
import { IntlProvider } from "react-intl";
import { CheckCircleOutlined, FrownOutlined, HeatMapOutlined, SmileOutlined } from '@ant-design/icons';

import '../styles/global.less'
import { BasicLayout } from "../layout/BasicLayout";

const menuDataRender = () => [
    // type MenuDataItem
    { name: "test", path: "/test", icon: <HeatMapOutlined/>, hideInMenu: false },
    {
        name: "Result", path: "/result", icon: <CheckCircleOutlined/>, children: [
            { name: "success", path: "/result/success", icon: <SmileOutlined/> },
            { name: "failure", path: "/result/failure", icon: <FrownOutlined/> },
        ],
    },
];

const LocaleContext = React.createContext({
    locale: 'en',
    setLocale: () => null
});

const getMessages = async (locale) => {
    try {
        return require(`../lang/${locale}.json`)
    } catch (error) {
        console.error(error);
        return require(`../lang/en.json`)
    }
};

const getLanguage = () => {
    let language = null;
    if (typeof window !== 'undefined') {
        if (localStorage) {
            language = localStorage.getItem('locale');
        }
        if (!language && navigator) {
            language = navigator.language.slice(0, 2);
        }
    }
    return language || 'en';
};

function App({ Component, pageProps }) {
    const [locale, setLocale] = React.useState(getLanguage());
    const [messages, setMessages] = React.useState({});
    React.useEffect(() => {
        console.log('LANG', locale);
        getMessages(locale).then(messages => setMessages(messages));
    }, [locale]);

    return (
        <IntlProvider key={locale} locale={locale} messages={messages}>
            <BasicLayout menuDataRender={menuDataRender}>
                <Component {...pageProps} />
            </BasicLayout>
        </IntlProvider>
    );
}


export default App;
