# US-12 Manual Test Cases

## Scope
Activity delete flow in trip room:
- Owner can see delete control and delete successfully
- Non-owner cannot delete
- Deletion is blocked when activity has upvotes
- Confirmation dialog behavior
- UI and persistence consistency after actions

## Preconditions
- Backend server is running.
- Frontend app is running.
- User A and User B exist and can log in.
- A trip room exists with at least one destination.
- At least one activity exists that was created by User A.

## TC1 - Delete Button Visibility (Owner)
1. Log in as User A (creator of the activity).
2. Open the trip room and navigate to the destination containing the activity.
3. Locate the activity card.

Expected:
- A delete button (trash icon) is visible on the activity card.

## TC2 - Delete Button Visibility (Non-Owner)
1. Log out and log in as User B (not creator).
2. Open the same trip room and destination.
3. Locate the same activity card.

Expected:
- No delete button is shown for that activity.
- User B cannot trigger deletion from the UI.

## TC3 - Confirmation Dialog Opens and Cancels
1. Log in as User A.
2. Click the delete button on an own activity.

Expected:
- A confirmation dialog opens.
- Dialog text indicates that deletion cannot be undone.

3. Click Cancel.

Expected:
- Dialog closes.
- Activity remains visible in the list.

## TC4 - Successful Deletion After Confirmation
1. Log in as User A.
2. Click delete on an own activity.
3. In the confirmation dialog, click Delete.

Expected:
- Activity is removed from the destination activity list immediately.
- A page refresh does not restore the deleted activity.

## TC5 - Deletion Blocked for Activity With Upvotes
1. Ensure an activity created by User A has at least 1 upvote.
2. As User A, click delete on that activity and confirm.

Expected:
- Activity is not deleted.
- Error feedback is shown: deletion is not allowed because the activity has received votes.
- Activity remains visible after refresh.

## TC6 - Deletion Blocked for Non-Owner (Server-Side Authorization)
1. Identify an activity created by User A.
2. As User B, attempt to call the delete endpoint for that activity (e.g. via API client with User B token).

Expected:
- Backend returns HTTP 403 Forbidden.
- Activity is unchanged and still visible in UI after refresh.

## TC7 - Endpoint Contract for Successful Delete
1. As activity owner, trigger deletion (from UI or API client).

Expected:
- Backend responds with HTTP 204 No Content.
- No response body is required.

## Notes
- If test data is reused, recreate deleted activities before rerunning dependent test cases.
- For TC5 and TC6, verify both immediate UI state and state after browser refresh.
