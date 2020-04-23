import React from "react";
import { CheckCircleOutlined, FrownOutlined, HeatMapOutlined, SmileOutlined } from '@ant-design/icons';

import '../styles/global.less'
import { BasicLayout } from "../layout/BasicLayout";

const menuDataRender = () => [
    // type MenuDataItem
    { name: "test", path: "/test", icon: <HeatMapOutlined/>, hideInMenu: false },
    {
        name: "Result", path: "/result", icon: <CheckCircleOutlined />, children: [
            { name: "success", path: "/result/success", icon: <SmileOutlined /> },
            { name: "failure", path: "/result/failure", icon: <FrownOutlined /> },
        ],
    },
];

export default function App({ Component, pageProps }) {
    return <BasicLayout menuDataRender={menuDataRender}><Component {...pageProps} /></BasicLayout>
};
