import dynamic from "next/dynamic";

const BasicLayout = dynamic(() => {
    const Component = import('@ant-design/pro-layout');
    import('../styles/overwrite.less');  // load after Layout
    return Component;
}, { ssr: false });

export default BasicLayout;
