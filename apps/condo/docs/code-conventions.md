Code conventions
=
We are following some convention about project structure and code style to make it easier to maintain the repository. 
## Frontend
Theese are main tools we are using for development:
- Typescript 
- Next.JS
- styled-components
- Ant Design library

Next.JS pages is located under pages folder. Next.JS is using folder locations as URL path. 
Examples:
```
path: /pages/division/create
url: /division/create

path: /pages/division/[id]/index
url: /pages/division/c43d9f9c-7b29-4f59-96d4-4da90148c37e

path: /pages/division/[id]/update
url: /pages/division/c43d9f9c-7b29-4f59-96d4-4da90148c37e/update
```
### Pages
Every folder and page file should be named **lowercase**
Examples:

<table>
<tr>
<th><span style="color:green">Good</span></th>
<th><span style="color:red">Bad</span></th>
</tr>
<tr>
<td>
<pre>
📦pages
 ┣ 📂reports
 ┃ ┣ 📂detail
 ┃ ┃ ┗ 📂report-by-tickets
 ┃ ┃ ┃ ┣ 📜index.tsx
 ┃ ┃ ┃ ┗ 📜pdf.tsx
 ┃ ┗ 📜index.tsx
 ┣ 📂settings
 ┃ ┣ 📂integration
 ┃ ┃ ┗ 📂[id]
 ┃ ┃ ┃ ┗ 📜index.tsx
 ┃ ┗ 📜index.tsx
 ┣ 📂ticket
 ┃ ┣ 📂[id]
 ┃ ┃ ┣ 📜index.tsx
 ┃ ┃ ┣ 📜pdf.tsx
 ┃ ┃ ┗ 📜update.tsx
 ┃ ┣ 📜create.tsx
 ┃ ┗ 📜index.tsx
 </pre>
</td>
<td>
<pre>
📦pages
 ┣ 📂reports
 ┃ ┣ 📂detail
 ┃ ┃ ┗ 📂reportByTickets
 ┃ ┃ ┃ ┣ 📜index.tsx
 ┃ ┃ ┃ ┗ 📜PDF.tsx
 ┃ ┗ 📜index.tsx
 ┣ 📂settings
 ┃ ┣ 📂integration
 ┃ ┃ ┗ 📂[id]
 ┃ ┃ ┃ ┗ 📜Index.tsx
 ┃ ┗ 📜index.tsx
 ┣ 📂ticket
 ┃ ┣ 📂[id]
 ┃ ┃ ┣ 📜index.tsx
 ┃ ┃ ┣ 📜pdf.tsx
 ┃ ┃ ┗ 📜update.tsx
 ┃ ┣ 📜createTicket.tsx
 ┃ ┗ 📜index.tsx
</pre>
</td>
</tr>
</table>


## Backend 
WIP