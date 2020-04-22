const withLess = require('@zeit/next-less');

// fix: prevents error when .less files are required by node
if (typeof require !== 'undefined') {
    require.extensions['.less'] = () => {}
}
module.exports = withLess({
    lessLoaderOptions: {
        javascriptEnabled: true
    }
});
