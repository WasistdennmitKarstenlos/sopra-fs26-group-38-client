# US-08 Manual Test Cases

## Scope
Destination edit flow in trip room:
- User can edit an existing destination name
- Changes are saved and shown immediately
- Edit can be cancelled without changing the destination
- Empty destination names are rejected
- Non-authorized users cannot edit destinations
- Edited data persists after refresh

## Preconditions
- Backend server is running.
- Frontend app is running.
- User A is logged in and has created or owns a trip with at least one destination.
- User B exists for permission testing.
- At least one destination has no activities for positive edit testing.
- At least one destination with activities exists for the blocked-edit case.

## TC1 - Edit Button Is Visible for Editable Destination
1. Log in as User A.
2. Open a trip room with a destination that can be edited.
3. Inspect the destination card.

Expected:
- An `Edit` button is visible on the destination card.

## TC2 - Successful Destination Edit
1. Log in as User A.
2. Open the trip room.
3. Click `Edit` on a destination.
4. Change the destination name to a new valid value.
5. Click `Save`.

Expected:
- The destination name updates immediately in the UI.
- A success message is shown.
- The new name remains after page refresh.

## TC3 - Edit Can Be Cancelled
1. Log in as User A.
2. Click `Edit` on a destination.
3. Modify the destination name.
4. Click `Cancel`.

Expected:
- The edit mode closes.
- The original destination name stays unchanged.
- No update is saved.

## TC4 - Empty Destination Name Is Rejected
1. Log in as User A.
2. Click `Edit` on a destination.
3. Clear the destination name.
4. Click `Save`.

Expected:
- The update is rejected.
- An error message is shown.
- The destination name remains unchanged.

## TC5 - Whitespace-Only Destination Name Is Rejected
1. Log in as User A.
2. Click `Edit` on a destination.
3. Enter only spaces in the destination name field.
4. Click `Save`.

Expected:
- The update is rejected.
- An error message is shown.
- The destination name remains unchanged.

## TC6 - Non-Authorized User Cannot Edit Destination
1. Log out and log in as User B.
2. Open the same trip room.
3. Inspect the destination card.
4. Try to edit the destination if the control is visible.

Expected:
- Non-authorized users cannot successfully edit the destination.
- The UI either hides the `Edit` action or shows an error on attempt.
- No changes are saved.

## TC7 - Destination Edit Is Blocked When It Already Has Activities
1. Log in as User A.
2. Open a destination that already contains activities.
3. Click `Edit` and change the destination name.
4. Click `Save`.

Expected:
- The update is rejected.
- An error message is shown.
- The destination name remains unchanged.

## TC8 - Edited Destination Data Persists After Refresh
1. Edit a destination successfully.
2. Refresh the browser page.

Expected:
- The edited destination name is still shown.
- The change was persisted correctly.

## TC9 - Edit Mode Shows Save and Cancel Actions
1. Log in as User A.
2. Click `Edit` on a destination.

Expected:
- The destination name becomes editable.
- `Save` and `Cancel` actions are visible.
- The card clearly indicates edit mode.

## Notes
- For TC6, verify the actual behavior for the user role in your implementation; if the `Edit` button is hidden, that also satisfies the restriction.
- For TC7, use the destination with activities to verify the blocked-update error state.
- For TC2 and TC8, verify both the immediate UI update and the state after refresh.