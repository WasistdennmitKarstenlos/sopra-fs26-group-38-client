# US-07 Manual Test Cases

## Scope
These manual frontend test cases cover issue #127 for the add-destination and real-time sync flow.

## Preconditions
- Backend server is running.
- Frontend app is running.
- At least two registered users are available.
- Both users are members of the same active trip.
- The trip is not finalized and is not in evaluation/read-only mode.
- Open the same trip room in two separate browser sessions:
  - Session A: logged in as User A.
  - Session B: logged in as User B.
- Use unique destination names for each run, for example `Lisbon`, to avoid confusing old data with new test data.

## TC1 - Add Destination Controls Are Available
1. In Session A, open the shared trip room.
2. Locate the `New Destination` section.

Expected:
- A destination name input is visible with placeholder `e.g. Rome`.
- The `Add Destination` button is visible.
- The input and button are enabled for an active, writable trip.
- No console errors appear while the trip room loads.

## TC2 - Add Destination Successfully
1. In Session A, enter a unique destination name, for example `Lisbon`.
2. Click `Add Destination`.

Expected:
- A success message `Destination added.` appears.
- The destination input is cleared.
- The new destination appears in the destination selector list near the top of the trip room.
- A destination card with the same name appears in the shared destination list.
- The new destination card initially shows `Score 0`.
- No console errors appear.

## TC3 - Saved Destination Name Is Trimmed
1. In Session A, enter a destination name with leading and trailing spaces, for example `Porto`.
2. Click `Add Destination`.

Expected:
- The saved destination appears as `Porto`, without leading or trailing spaces.
- The destination input is cleared after save.
- No duplicate blank or whitespace-only destination appears.

## TC4 - Empty Destination Name Is Rejected
1. In Session A, leave the destination input empty.
2. Click `Add Destination`.
3. Enter only spaces in the destination input.
4. Click `Add Destination` again.

Expected:
- An error message `Destination name cannot be empty.` appears.
- No new destination card is added.
- The existing destination list remains unchanged.
- No destination creation request should be visible in the browser network tab for either empty submission.

## TC5 - Destination Appears for Another Connected User in Real Time
1. Keep Session A and Session B open on the same trip room.
2. In Session B, note the current destination list.
3. In Session A, add a unique destination, for example `Tokyo`.
4. Do not refresh Session B.

Expected:
- `Tokyo` appears in Session A immediately after saving.
- `Tokyo` appears in Session B without a page refresh.
- The update appears in Session B within a few seconds of the save.
- Session B shows the destination in both the selector list and the destination card list.
- No duplicate copy of the same destination appears in either session.
- No console errors appear in either session.

## TC6 - Real-Time Sync Works from Either Participant
1. Keep both sessions open on the same trip room.
2. In Session B, add a unique destination, for example `Madrid`.
3. Do not refresh Session A.

Expected:
- `Madrid` appears in Session B immediately after saving.
- `Madrid` appears in Session A without a page refresh.
- Both sessions show the same destination list after the sync completes.
- No console errors appear in either session.

## TC7 - Destination Persists After Refresh
1. Add a unique destination in either session, for example `Berlin`.
2. Wait until both sessions show the new destination.
3. Refresh Session A.
4. Refresh Session B.

Expected:
- `Berlin` remains visible after both page refreshes.
- The refreshed pages load the same shared destination list from the backend.
- No destination disappears after reload unless it was explicitly deleted.

## TC8 - Read-Only Trip Does Not Allow Adding Destinations
1. Open a finalized or evaluation/read-only trip room.
2. Locate the `New Destination` section.

Expected:
- The destination input is disabled.
- The `Add Destination` button is disabled.
- A user cannot add another destination from the frontend while the trip is read-only.
