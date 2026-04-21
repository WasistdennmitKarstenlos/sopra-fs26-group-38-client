# US-05 Manual Test Cases

## Preconditions
- Backend server is running.
- Frontend app is running.
- At least two test users are registered and logged in on separate browser sessions.
- Both users have joined or created the same trip and have the trip room page open.

## TC1 - Add Destination Button Is Visible
1. Open a trip room page as a logged-in user.
2. Locate the destination section.

Expected:
- A text input with placeholder `e.g. Rome` is visible.
- An `Add Destination` button is visible next to or below the input.

## TC2 - Add a Destination Successfully
1. Open a trip room page.
2. Type a location name (e.g. `Paris`) into the destination input field.
3. Click `Add Destination`.

Expected:
- A success feedback message appears.
- The new destination card (`Paris`) appears in the destination list.
- The input field is cleared after submission.

## TC3 - Destination Appears in Real Time for Other Users
1. Open the same trip room in a second browser session as a different user.
2. In the first session, add a destination (e.g. `Tokyo`).

Expected:
- `Tokyo` appears in the destination list of the second session without a page refresh.

## TC4 - Destination Persists After Page Refresh
1. Add a destination (e.g. `Berlin`) to a trip.
2. Reload the trip room page.

Expected:
- `Berlin` is still present in the destination list after the reload.

## TC5 - Empty Destination Name Is Rejected
1. Leave the destination input field empty.
2. Click `Add Destination`.

Expected:
- An error message is shown (e.g. "Destination name cannot be empty.").
- No new destination card is added to the list.

## TC6 - Multiple Destinations Can Be Added
1. Add a first destination (e.g. `Rome`).
2. Add a second destination (e.g. `Madrid`).

Expected:
- Both `Rome` and `Madrid` appear as separate cards in the destination list.
- Both are visible to all connected users.
