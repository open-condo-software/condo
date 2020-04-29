# ANT DESIGN PRO #

Limitations:
 - you should always use `.less` extension for all your CSS files because of https://github.com/zeit/next.js/issues/9830
 - you should always hard code className sting: use `className="title"` instead `className={styles.title}` (not supported by `@zeit/next-less`)
 - you should always think about import order! if you have a classes with the same name in a different pages
 - you should always use dynamic import for `@ant-design/pro-layout` components without SSR (see below)

## Import @ant-design/pro-layout components ##

> NOTE: you should always use dynamic import for all `@ant-design/pro-layout` components!

You can check the `layout/BasicLayout/PageHeaderWrapper.jsx` sample. 
And look at `pages/index.jsx`. You will find something like `import { PageHeaderWrapper } from "../layout/BasicLayout";` 
statement instead of `import { PageHeaderWrapper } from '@ant-design/pro-layout';`

Error example:

```bash
pahaz@PahazMac16 $ yarn workspace @app/_example04antpro next build
yarn workspace v1.22.4
yarn run v1.22.4
$ /my-keystone-app/node_modules/.bin/next build
Warning: Built-in CSS support is being disabled due to custom CSS configuration being detected.
See here for more info: https://err.sh/next.js/built-in-css-disabled

> Using external babel configuration
> Location: "/my-keystone-app/apps/_example04antpro/.babelrc"
Creating an optimized production build  

Compiled with warnings.

chunk 30c8b362d7d0bde7994afe0081bbbbfde03fd101_CSS [mini-css-extract-plugin]
Conflicting order between:
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!/my-keystone-app/node_modules/antd/lib/spin/style/index.less
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!/my-keystone-app/node_modules/antd/lib/tooltip/style/index.less

chunk 30c8b362d7d0bde7994afe0081bbbbfde03fd101_CSS [mini-css-extract-plugin]
Conflicting order between:
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!./layout/BasicLayout/BasicLayout.less
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!/my-keystone-app/node_modules/antd/lib/tooltip/style/index.less

chunk 30c8b362d7d0bde7994afe0081bbbbfde03fd101_CSS [mini-css-extract-plugin]
Conflicting order between:
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!/my-keystone-app/node_modules/antd/lib/dropdown/style/index.less
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!/my-keystone-app/node_modules/antd/lib/tooltip/style/index.less

chunk 30c8b362d7d0bde7994afe0081bbbbfde03fd101_CSS [mini-css-extract-plugin]
Conflicting order between:
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!/my-keystone-app/node_modules/antd/lib/avatar/style/index.less
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!/my-keystone-app/node_modules/antd/lib/tooltip/style/index.less

chunk 30c8b362d7d0bde7994afe0081bbbbfde03fd101_CSS [mini-css-extract-plugin]
Conflicting order between:
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!/my-keystone-app/node_modules/antd/lib/menu/style/index.less
 * css /my-keystone-app/node_modules/@zeit/next-css/node_modules/css-loader??ref--5-1!/my-keystone-app/node_modules/less-loader/dist/cjs.js??ref--5-2!/my-keystone-app/node_modules/antd/lib/tooltip/style/index.less


> Build error occurred
/my-keystone-app/node_modules/antd/lib/style/index.less:1
@import './themes/index';
^

SyntaxError: Invalid or unexpected token
    at compileFunction (<anonymous>)
    at wrapSafe (internal/modules/cjs/loader.js:1070:16)
    at Module._compile (internal/modules/cjs/loader.js:1120:27)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1176:10)
    at Module.load (internal/modules/cjs/loader.js:1000:32)
    at Function.Module._load (internal/modules/cjs/loader.js:899:14)
    at Module.require (internal/modules/cjs/loader.js:1042:19)
    at require (internal/modules/cjs/helpers.js:77:18)
    at Object.<anonymous> (/my-keystone-app/node_modules/antd/lib/layout/style/index.js:3:1)
    at Module._compile (internal/modules/cjs/loader.js:1156:30) {
  type: 'SyntaxError'
}
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
error Command failed.
Exit code: 1
Command: /node/v12.16.2/bin/node
Arguments: /node/v12.16.2/lib/node_modules/yarn/lib/cli.js next build
Directory: /my-keystone-app/apps/_example04antpro
Output:

info Visit https://yarnpkg.com/en/docs/cli/workspace for documentation about this command.
```
