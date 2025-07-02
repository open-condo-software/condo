This directory contains all the React components. 

At first, you might split up your code between /components and /containers folders. 
This works for small sites but you’ll find yourself look for something more robust 
when scaling to larger sites.

Read this: https://css-tricks.com/domain-driven-design-with-react/

Beside the domain folders, you can also extract some specific folders like:

 - `elements` - contains all the basic UI kit blocks which not related to domain components.
  For example a button or a title component. 
  Look at https://ant.design/components/overview/ 
 - `modules` - contains components which not related to domain and which are more than 
  a basic building block. For example, a component smart table component which does 
  not depend on a specific model, which allows you to sort and filter data by columns. 
  Look at https://github.com/ag-grid/ag-grid#ag-grid

You can read more detail about domain logic in the [domains/README](../../README.md) file.
