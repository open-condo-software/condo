To import icons from Figma, create a .env file and populate the following variables in it:
- FIGMA_API_TOKEN - your personal access token from Figma
- FIGMA_FILE_ID - Figma [file id](https://help.figma.com/hc/en-us/articles/360052378433-Bubble-and-Figma), where icons are stored
- FIGMA_PAGE_NAME - Name of page, where icon components are stored 
- FIGMA_COMPONENT_PREFIX - Prefix to filter specific icon set. Usually something like `Icons/24x24`

After that run the following script:
```bash
yarn workspace @open-condo/icons import:figma
```