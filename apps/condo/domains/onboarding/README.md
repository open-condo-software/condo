# Tour

## About
The Tour feature is designed to allow users to familiarize themselves with the new features of the platform and learn how to use it.

When creating an organization using the `createTourStepsForOrganization` function, tour steps are automatically generated based on predefined descriptions in the `/constants/steps` files. These tour steps can be of two types: external steps (keys in `STEP_TRANSITIONS`), which form the main flow of the tour, and internal steps (values in `STEP_TRANSITIONS`), specific to each tour flow.

Users select one of the tour flows, and the selected flow is saved in the browser's local storage. This allows the system to track the user's current progress and display corresponding modal windows for each tour step within the chosen flow.

When a user performs an action on the platform (web client) related to a specific tour step, the status of that step is updated to "Completed". If the action was performed outside the platform, the status update of the steps will occur automatically upon the user's next login to the platform or upon changing the organization (`SyncTourStepsService`).

## To add a new step to the tour, follow these steps:
1. Update `constants/steps.js`
   - Add the step type as a constant in `constants/steps.js`
   - Add the new type in the list of `STEP_TYPES`
   - Specify which tour flow this step type belongs to in the STEP_TRANSITIONS constant. If it's a new tour flow, the type should be an object key; if it's an internal step, it should be an element in the array value.
   - Add the step to `INITIAL_ENABLED_STEPS` if it should be `todo` status immediately (by default it's `disabled` status)
   - Specify after which type of step the new step will be active upon completion in `ENABLED_STEPS_AFTER_COMPLETE`
   - Specify the step weight for client-side sorting in `STEP_ORDER` (Sorting in ascending order)
2. Add a new step for existing organizations using migration, for example `20240318130011-0375_alter_tourstep_type`
3. Add logic to synchronize the step status in `schema/SyncTourStepsService.js`
4. Add handling for the event associated with completing the step in `contexts/TourContext.tsx`
5. Add constants on the client side: 
   - `TODO_STEP_CLICK_ROUTE` – link when clicking on an active step in the tour
   - `TOUR_STEP_ACTION_PERMISSION` – permission allowing the step to be completed (if not specified, anyone can)
   - `COMPLETED_STEP_LINK` - link in the completed step
6. Add logic for the modal when completing the step in `hooks/useCompletedTourModals` in the `completedStepModalDataDescription` constant
7. Add translations:
   - For the card in the tour page: tour.step.`stepType`.`stepStatus`.title, ...
   - For the modal window when completing the step: tour.completedStepModal.`stepType`.title, ... or tour.completedFlowModal.`stepType`.title if step it's a tour flow.

## Additional:
- To display all content in the feature, add environment variables to `.env`:
  - TOUR_VIDEO_URL='{"default": videoUrl, "ticket": videoUrl, "billing": videoUrl, "meter": videoUrl, "resident": videoUrl }'
  - EXTERNAL_GUIDE_URL=guideUrl
  - RESIDENT_APP_LANDING_URL=landingUrl
  - CREATE_MAP_VIDEO_URL=videoUrl