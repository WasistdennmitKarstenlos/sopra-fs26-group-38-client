# US-13 Manual Test Cases

## Scope
Activity voting flow in trip room:
- User can upvote and downvote an activity
- Exactly one vote per user per activity
- Voting toggles when the same vote is clicked again
- Switching vote direction replaces the previous vote
- Activity score updates as upvotes - downvotes
- Destination ranking updates dynamically based on total activity scores
- Voting is blocked in evaluation mode and after finalization

## Preconditions
- Backend server is running.
- Frontend app is running.
- A user is logged in.
- A trip room exists with at least two destinations.
- Each destination has at least one activity with vote counters available.
- At least one second user exists for cross-user verification.

## TC1 - Upvote an Activity
1. Open a trip room as a logged-in user.
2. Locate an activity card with vote controls.
3. Click the thumbs up icon once.

Expected:
- The activity's upvote count increases by 1.
- The activity score increases by 1.
- The thumbs up control shows the active state.
- The updated vote state remains after page refresh.

## TC2 - Downvote an Activity
1. Open the same or another activity card.
2. Click the thumbs down icon once.

Expected:
- The activity's downvote count increases by 1.
- The activity score decreases by 1.
- The thumbs down control shows the active state.
- The updated vote state remains after page refresh.

## TC3 - Same Vote Click Toggles Off
1. Upvote an activity.
2. Click the thumbs up icon again.

Expected:
- The upvote is removed.
- The upvote count returns to its previous value.
- The activity score returns to its previous value.
- No vote remains selected for that activity.

## TC4 - Switching Vote Replaces Previous Vote
1. Upvote an activity.
2. Click the thumbs down icon on the same activity.

Expected:
- The previous upvote is removed.
- The downvote is added.
- The upvote count decreases by 1 compared to the state before the first vote.
- The downvote count increases by 1.
- The activity score changes from +1 to -1 relative to the original state.

## TC5 - Exactly One Vote Per Activity
1. As the same logged-in user, try to vote on the same activity multiple times in a row.
2. Alternate between upvote and downvote clicks.

Expected:
- Only one current vote is active at any time.
- The UI never shows both votes selected simultaneously.
- The final state always reflects either no vote, an upvote, or a downvote.

## TC6 - Activity and Destination Ranking Update Dynamically
1. Note the initial left-to-right destination order.
2. Vote on activities so that one destination gains a higher total activity score than another destination.
3. Observe the destination cards after each vote.

Expected:
- Activity scores update immediately after each vote.
- The destination with the higher total activity score moves further to the left.
- The ordering updates without a full page reload.

## TC7 - Voting Is Blocked in Evaluation Mode
1. Put the trip into evaluation mode.
2. Open an activity card.
3. Try to click thumbs up or thumbs down.

Expected:
- Voting is disabled or rejected.
- No vote counts change.
- No new vote is stored.

## TC8 - Voting Is Blocked After Finalization
1. Finalize the trip.
2. Open an activity card in the finalized trip.
3. Try to click thumbs up or thumbs down.

Expected:
- Voting is disabled or rejected.
- No vote counts change.
- The trip remains read-only.

## Notes
- For TC6, use at least two destinations with clear score differences to verify left-to-right reordering.
- For TC7 and TC8, verify both the immediate UI state and the state after a page refresh.