DOMA-3099 Tasks
=====

## Overview

New implementation of export feature using batching and progress tracking.

Domain-agnostic tasks implementation

Frontend:
- Load and display all tasks of current user with 'processing' status
- Display tasks list using `notification` module from Ant
- Control expanded and collapsed visual state of `TasksProgress` component
- Add new task to tracking list
- Handle transition of the task to 'completed' status

Backend:
- Domain-agnostic `exportRecords` function
- Domain-specific `exportTicketsTask` function, that utilizes `exportRecords`
- New schema `TicketExportTask` which stores requested query parameters, progress and result of exporting ticket feature
- Executing `exportTicketsTask` after record of `TicketExportTask` was created
- Saves stream of generated file directly to `File` field of `TicketExportTask` (never done before, unobvious implementation from discovering sources of `graphql` package)


## Task basics

A tasks is a domains-specific set of backend operations, executed asyncronously by worker and have a relatively long time to be completed (from minutes, to hours and even longer).
Task is implemented by:
- Domain-specific schema to track progress and store execution result
- Domain-specific backend behaviour to execute operations and calculate progress
- Domain-specific front-end behaviour to display progress information on progress notification-like panel and handle transition to `completed` status

For example a tickets export is implemented by:
- Schema `TicketExportTask`, that stores requested query parameters (`where` condition, `sortBy`), locale, timeZone to convert timestamps, progress and result of exporting ticket feature in `file` field
- Backend logic that loads records from `Ticket` table in batches, converts it to intermediate representation of table columns in JSON and store it in Excel-file
- Frontend logic, that displays infinite progress indicator, textual status information about exported tickets and handles transition to `completed` status by downloading a result Excel-file


## Frontend

Information about currently processing and completed tasks is represented by `TasksProgress` component.
It looks like a notification from Ant.

The `TasksProgress` component has:
- general title and description
- list of tasks, executed by current user, tracked and displayed by `TaskTracker` component

They are two main cases of displaying tasks on front-end:
1. All tasks started without reloading a page
2. Tasks with `processing` status, started before page was reloaded. User starts taks(s), reloads a front-end (browser page or mobile screen), all tasks with `processing` status are loaded again by front-end

**Case 2 with initial loading tasks in `processing` on first front-end loading requires us to determine a front-end behaviour implementaion by value of `__typename` field of task record.**

That's why an abstract `ITask` and `ITaskTrackableItem` interfaces was introduced.

Domain-agnostic implementation of tasks is located in `apps/condo/domains/common/components/tasks` folder.

### Implementing a task in front-end

1. Create a hook in `domains/*/components/hooks/use[Domain][Action]Task`
   For example like a `domains/ticket/components/hooks/useTicketExportTask.tsx`
2. Use its `TaskLauncher` in appropriate page
   For example like in `pages/ticket/index.tsx`
3. Mount it into `pages/_app.tsx`


## Backend

Backend implementation of a task is completely domain-specific.

Btw, one common feature, used across many domains is export.
Domain-agnostic implementation of export with batch loading is located in `apps/condo/domains/common/utils/serverSchema/export.js`.

Some useful domain-agnostic constants are located in `apps/condo/domains/common/constants/tasks.js`.

A schema for a task should be named in following format:
`[Domain][Action]Task`, like `TicketExportTask`, `PropertyImportTask`.

Examples of Keystone schemas for domain-specific tasks:
- `apps/condo/domains/ticket/schema/TicketExportTask.js`.

A task worker function should be delayed when a record of task schema is created.
Example can be found in `afterChange` handler of `TicketExportTask`.



