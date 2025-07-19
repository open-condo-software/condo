# Tour

## About
The Tour feature is designed to allow users to familiarize themselves with the new features of the platform and learn how to use it.

When creating an organization using the `createTourStepsForOrganization` function, tour steps are automatically generated based on predefined descriptions in the `/constants/steps` files. These tour steps can be of two types: external steps (keys in `STEP_TRANSITIONS`), which form the main flow of the tour, and internal steps (values in `STEP_TRANSITIONS`), specific to each tour flow.

Users select one of the tour flows, and the selected flow is saved in the browser's local storage. This allows the system to track the user's current progress and display corresponding modal windows for each tour step within the chosen flow.

When a user performs an action on the platform (web client) related to a specific tour step, the status of that step is updated to "Completed". If the action was performed outside the platform, the status update of the steps will occur automatically upon the user's next login to the platform or upon changing the organization (`SyncTourStepsService.js`).

## To add a new step to the tour, follow these steps:
1. Update `constants/steps.js`
2. Add a new step for existing organizations using migration, for example `20240318173552-0376_alter_tourstep_type`
3. Add logic to synchronize the step status in `schema/SyncTourStepsService.js`
4. Add handling for the event associated with completing the step in `contexts/TourContext.tsx`
5. Add constants on the client side in `utils/clientSchema/constants.ts`:
6. Add logic for the modal when completing the step in `hooks/useCompletedTourModals` in the `completedStepModalDataDescription` constant
7. Add translations:
   - For the card in the tour page: tour.step.`stepType`.`stepStatus`.title, etc.
   - For the modal window when completing the step: tour.completedStepModal.`stepType`.title, etc. or tour.completedFlowModal.`stepType`.title if step it's a tour flow.

## Additional:
- To display all content in the feature, add environment variables to `.env`:
  - TOUR_VIDEO_URL='{ [locale]: { "default": videoUrl, "ticket": videoUrl, "billing": videoUrl, "meter": videoUrl, "resident": videoUrl } }'
  - RESIDENT_APP_LANDING_URL='{ [locale]: landingUrl }'
  - CREATE_MAP_VIDEO_URL='{ [locale]: videoUrl }'
  - GUIDE_ABOUT_APP_BLOCK='{ [locale]: { "types": { "payments": { "imageUrl": url, "title": text, "modalText": text, "modalText.secondParagraph": text, "bannerText": text }, "costs": { "imageUrl": url, "title": text, "modalText": text, "bannerText": text }, "quality": { "imageUrl": url, "title": text, "modalText": text, "bannerText": text }, "extraIncome": { "imageUrl": url, "title": text, "modalText": text, "bannerText": text } }, "title": text } }' 
  - GUIDE_INTRODUCE_APP_BLOCK='{ [locale]: { "types": { "announcement": { "imageUrl": url, "materialsUrl": url, "title": text, "body": text, "body.secondParagraph": text, "downloadMaterials": text }, "chats": { "imageUrl": url, "materialsUrl": url, "title": text, "body": text, "downloadMaterials": text }, "layout": { "imageUrl": url, "materialsUrl": url, "title": text, "body": text, "body.secondParagraph": text, "body.thirdParagraph": text, "downloadMaterials": text }, "banner": { "imageUrl": url,  "materialsUrl": url, "title": text, "body": text, "downloadMaterials": text }, "socialNetworks": { "imageUrl": url, "materialsUrl": url, "title": text, "body": text, "downloadMaterials": text }, "leaflet": { "imageUrl": url, "materialsUrl": url, "title": text, "body": text, "downloadMaterials": text }, "stickers": { "imageUrl": url, "materialsUrl": url, "title": text, "body": text, "downloadMaterials": text } }, "title": text } }' 
  - GUIDE_MODAL_CARD_REVIEWS='{ [locale]: { "types": { "payments": { "text": text, "imageUrl": url, "blogUrl": url }, "costs": { "text": text, "imageUrl": url, "blogUrl": url }, "quality": { "text": text, "imageUrl": url, "blogUrl": url }, "extraIncome": { "text": text, "imageUrl": url, "blogUrl": url } }, "textLink": text } }'
  - 