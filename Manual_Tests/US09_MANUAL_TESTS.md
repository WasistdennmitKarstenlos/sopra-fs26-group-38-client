# US-09 Manual Test Cases

## Preconditions
- Backend server is running.
- Frontend app is running and user is logged in.
- At least one active trip exists with destinations.
- A second registered user is available for permission tests.

## TC1 - Delete Button Visibility (Creator, No Activities)
1. Log in as User A who created a trip.
2. Add a destination (e.g., "Paris") to the trip.
3. View the trip room.

Expected:
- The destination card displays Edit and Delete buttons under the score.
- Both buttons are visible and clickable.
- No console errors appear.

## TC2 - Delete Button Hidden for Non-Creator
1. Log in as User A and create a trip.
2. Add a destination (e.g., "Berlin").
3. Log out and log in as User B.
4. Join the trip with an invite code.
5. View the trip room.

Expected:
- User B's view does NOT show Edit or Delete buttons for the "Berlin" destination.
- The destination card still displays the score and name.

## TC3 - Delete Button Hidden When Activities Exist
1. Log in as User A who created a trip with a destination "London".
2. Add an activity to the "London" destination (e.g., "Visit Big Ben").
3. View the trip room.

Expected:
- The Delete button is NOT visible for "London".
- Only the destination name and score are displayed.
- Edit button is also hidden due to activity presence.

## TC4 - Confirmation Dialog Appears on Delete Click
1. Log in as User A who created a trip.
2. Add a destination (e.g., "Amsterdam") with no activities.
3. Click the Delete button.

Expected:
- A confirmation dialog appears with text like "Are you sure you want to delete 'Amsterdam'?"
- Dialog shows "Yes, delete" and "Cancel" buttons.
- The page behind the dialog is slightly dimmed or blurred.

## TC5 - Successful Deletion After Confirmation
1. Follow TC4 to open the confirmation dialog.
2. Click "Yes, delete".

Expected:
- The confirmation dialog closes.
- The "Amsterdam" destination disappears from the destination list.
- No error message is shown.
- The trip room updates in real-time (if multiple users are connected, they also see the destination removed).

## TC6 - Deletion Cancelled
1. Follow TC4 to open the confirmation dialog.
2. Click "Cancel".

Expected:
- The confirmation dialog closes.
- The "Amsterdam" destination remains in the list.
- No deletion occurs.

## TC7 - Error Message: Cannot Delete (Has Activities)
1. Log in as User A who created a destination "Rome" with an activity.
2. Try to directly trigger a delete request (or simulate attempting to delete via DevTools).

Expected:
- An error message appears: "This destination has activities. Please remove them first before deleting."
- The destination remains in the list.
- No deletion occurs.

## TC8 - Error Message: Not Creator
1. Log in as User A and create a trip with destination "Venice".
2. Log out and log in as User B.
3. Join the trip.
4. Attempt to delete "Venice" (e.g., via DevTools simulating a DELETE request with User B's token).

Expected:
- An error message appears: "You can only delete destinations you created."
- The destination remains in the list.
- No deletion occurs.

## TC9 - Real-Time Update on Deletion
1. Open the trip room in two browser windows/tabs:
   - Tab A: Logged in as User A (creator).
   - Tab B: Logged in as User B (participant).
2. In Tab A, add a destination "Tokyo" with no activities.
3. Ensure both tabs show "Tokyo" in the destination list.
4. In Tab A, delete "Tokyo" and confirm.

Expected:
- "Tokyo" disappears from Tab A's list immediately.
- "Tokyo" disappears from Tab B's list within 1-2 seconds (SSE real-time update).
- No errors in either tab's console.

## TC10 - Edit and Delete Buttons Together
1. Log in as User A who created a trip.
2. Add a destination (e.g., "Barcelona").
3. View the destination card.

Expected:
- Both Edit and Delete buttons appear under the score.
- Edit button allows inline editing of the destination name.
- Delete button triggers the confirmation dialog.
- After editing and saving, the destination name updates and buttons remain visible.

## TC11 - Read-Only Mode Hides Delete Button
1. Log in as User A and create a trip.
2. Add a destination "Madrid".
3. Finalize or close the trip (enter read-only mode).
4. View the trip room.

Expected:
- The Delete button is NOT visible.
- No delete action can be triggered.
- An appropriate read-only indicator is displayed (if applicable).

## TC12 - Multiple Deletions in Sequence
1. Log in as User A who created a trip.
2. Add three destinations: "Paris", "London", "Rome".
3. Delete "Paris" and confirm.
4. Delete "London" and confirm.
5. View the destination list.

Expected:
- "Paris" and "London" are removed.
- "Rome" remains.
- No errors occur.
- The trip room remains responsive.

## TC13 - Destination Not Found Error
1. Log in as User A who created a trip.
2. Add a destination "Berlin".
3. Open the trip in another window and delete "Berlin" from there.
4. In the original window, attempt to delete "Berlin" (or refresh and try).

Expected:
- An error message appears: "Destination not found. It may have already been deleted."
- The destination list updates to remove "Berlin".
- No exception is logged in the backend.
