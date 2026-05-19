# US-14 Manual Test Cases

## Scope
Final Evaluation flow in trip room:
- Final Evaluation button is visible only to the host
- Button is enabled only when activation conditions are met
- Activating Final Evaluation switches the trip to read-only evaluation mode
- Creation, editing, deleting, commenting, and voting actions are disabled in evaluation mode
- Evaluation mode blocks all new submissions until the trip is finalized

## Preconditions
- Backend server is running.
- Frontend app is running.
- User A is the host of a trip.
- User B is a participant of the same trip.
- At least one trip exists with at least one destination and one activity.
- At least one additional trip exists with no destinations for negative-condition testing.

## TC1 - Final Evaluation Button Is Visible Only to the Host
1. Log in as User A, the host.
2. Open the trip room.
3. Inspect the top-level trip actions.

Expected:
- The `Final Evaluation` button is visible to the host.

4. Log out and log in as User B, a participant but not the host.
5. Open the same trip room.

Expected:
- The `Final Evaluation` button is not visible for non-host users.

## TC2 - Final Evaluation Button Is Disabled When No Destination Exists
1. Log in as User A, the host.
2. Open a trip that does not have any destinations yet.
3. Inspect the `Final Evaluation` button.

Expected:
- The button is visible only if the UI still shows it for the host.
- The button is disabled because no destination exists.
- The trip cannot be moved into evaluation mode from this state.

## TC3 - Final Evaluation Button Is Disabled When Trip Is Already in Evaluation Mode
1. Log in as User A.
2. Open a trip that has already been switched to evaluation mode.
3. Inspect the `Final Evaluation` button.

Expected:
- The button is disabled or no longer actionable.
- The trip remains in evaluation mode.

## TC4 - Final Evaluation Button Is Disabled After Trip Finalization
1. Log in as User A.
2. Open a finalized trip.
3. Inspect the `Final Evaluation` button.

Expected:
- The button is disabled or not shown.
- Finalized trips cannot be switched back to evaluation mode.

## TC5 - Host Can Activate Final Evaluation Successfully
1. Log in as User A, the host.
2. Open a trip with at least one destination.
3. Click `Final Evaluation`.

Expected:
- The trip switches into evaluation mode.
- The UI shows the trip as read-only.
- New submissions are no longer accepted.

## TC6 - No New Destinations Can Be Added in Evaluation Mode
1. Activate evaluation mode for a trip.
2. Try to use the `Add Destination` flow.

Expected:
- Adding a new destination is disabled or blocked.
- No new destination is created.

## TC7 - No Destination Editing or Deletion in Evaluation Mode
1. Activate evaluation mode for a trip.
2. Open a destination card.
3. Try to use edit or delete actions for the destination.

Expected:
- Edit and delete actions are disabled or hidden.
- The destination cannot be changed or removed.

## TC8 - No New Activities Can Be Added in Evaluation Mode
1. Activate evaluation mode for a trip.
2. Open a destination card.
3. Try to click `Add Event`.

Expected:
- The `Add Event` action is disabled or blocked.
- No activity search modal can be used to add new activities.

## TC9 - No Activity Editing or Deletion in Evaluation Mode
1. Activate evaluation mode for a trip.
2. Open an activity card.
3. Try to use edit or delete actions on the activity.

Expected:
- Edit and delete actions are disabled or hidden.
- The activity cannot be changed or removed.

## TC10 - No Comments or Votes Can Be Added in Evaluation Mode
1. Activate evaluation mode for a trip.
2. Open an activity card.
3. Try to add a comment.
4. Try to click thumbs up or thumbs down.

Expected:
- Comment input and submit actions are disabled or blocked.
- Vote controls are disabled or blocked.
- No comment or vote is created or changed.

## TC11 - Evaluation Mode Is Clearly Visible in the UI
1. Activate evaluation mode for a trip.
2. Inspect the trip room and its destination/activity cards.

Expected:
- The UI clearly indicates the trip is in evaluation mode or read-only.
- Interaction buttons related to creation, editing, deleting, commenting, or voting are disabled.

## TC12 - Read-Only Restrictions Persist After Refresh
1. Activate evaluation mode for a trip.
2. Refresh the browser page.
3. Re-check destinations, activities, comments, and vote controls.

Expected:
- The trip is still in evaluation mode after refresh.
- Read-only restrictions are still enforced.
- No interaction controls become re-enabled after reload.

## Notes
- For TC5 through TC12, verify both the immediate UI state and the state after a browser refresh whenever possible.
- If a control is hidden instead of disabled, that still satisfies the read-only requirement as long as the action cannot be performed.