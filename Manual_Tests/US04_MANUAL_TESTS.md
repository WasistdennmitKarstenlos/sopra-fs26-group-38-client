# US-04 Manual Test Cases

## Scope
Create trip room flow:
- Logged-in user can create a trip by providing a trip name
- Creator becomes the host of the trip
- A unique room code is generated automatically
- Creator is redirected to the trip room after successful creation
- Trip data is stored with creation date and host ID
- Validation and server errors are shown when creation fails

## Preconditions
- Backend server is running.
- Frontend app is running.
- A registered user exists and is logged in.
- No active trip creation is in progress.

## TC1 - Create Trip Form Is Available
1. Log in as a registered user.
2. Open the create-trip page or modal.
3. Inspect the form.

Expected:
- Trip name field is visible.
- Create Trip button is visible.
- Back to Dashboard button is visible.

## TC2 - Successful Trip Creation Redirects to Trip Room
1. Log in as a registered user.
2. Open the create-trip page.
3. Enter a valid trip name.
4. Click `Create Trip`.

Expected:
- Trip creation succeeds.
- The user is redirected to the created trip room.
- The trip room URL contains the generated room code.

## TC3 - Creator Becomes the Host
1. Create a trip successfully as User A.
2. Open the created trip room.
3. Inspect host-only actions or host information.

Expected:
- User A is treated as the host of the new trip.
- Host-only actions are available to the creator.

## TC4 - Unique Room Code Is Generated
1. Create a trip successfully.
2. Note the room code in the URL or trip room header.
3. Create another trip with a different name.

Expected:
- Each created trip receives a room code automatically.
- Room codes are unique across different trips.

## TC5 - Empty Trip Name Is Rejected
1. Open the create-trip page.
2. Leave the trip name empty.
3. Click `Create Trip`.

Expected:
- Trip creation fails.
- An error message is shown.
- The user stays on the create-trip screen.

## TC6 - Whitespace-Only Trip Name Is Rejected
1. Open the create-trip page.
2. Enter only spaces into the trip name field.
3. Click `Create Trip`.

Expected:
- Trip creation fails.
- An error message is shown.
- No trip is created.

## TC7 - Duplicate Trip Name Shows Server Error
1. Create a trip with a specific name.
2. Try to create another trip with the same name.

Expected:
- Trip creation fails.
- An error message is shown.
- The user remains on the create-trip screen.

## TC8 - Trip Is Stored With Creation Date and Host ID
1. Create a trip successfully.
2. Inspect the trip data through the backend, database, or an existing debug/profile view if available.

Expected:
- The trip has a creation date stored.
- The trip has a host ID stored.
- The stored data matches the creator.

## TC9 - User Can Return to Dashboard From Create Page
1. Open the create-trip page.
2. Click `Back to Dashboard`.

Expected:
- The user is redirected back to the dashboard or user overview.
- No trip is created.

## TC10 - Failed Creation Keeps User on Create Flow
1. Enter invalid input or trigger a server-side creation error.
2. Submit the form.

Expected:
- An error message is shown.
- The user remains on or is returned to the create-trip screen.
- No redirect to a trip room occurs.

## Notes
- For TC2 through TC4, verify the trip room after the redirect to ensure the created trip is usable.
- For TC8, use backend inspection, database access, or an existing admin/debug view if the UI does not show creation date and host ID directly.