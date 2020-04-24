# ANT DESIGN PRO #

 - you should always use `.less` extension for all your CSS files because of https://github.com/zeit/next.js/issues/9830

## Import @ant-design/pro-layout components ##

> NOTE: you should always use dynamic import for all `@ant-design/pro-layout` components!

You can check the `layout/BasicLayout/PageHeaderWrapper.jsx` sample. 
And look at `pages/index.jsx`. You will find something like `import { PageHeaderWrapper } from "../layout/BasicLayout";` 
statement instead of `import { PageHeaderWrapper } from '@ant-design/pro-layout';`
