import Header from "./Hearer";

const layoutStyle = {
    margin: `20px`,
};

const Layout = (props) => (<div>
    <Header/>
    <div style={layoutStyle}>
        {props.children}
    </div>
</div>);

export default Layout;