# US-06 Manual Test Cases

## Preconditions
- Backend server is running.
- Frontend app is running and user is logged in.
- At least one trip exists with a known invite code (created by a host user).
- A second registered user (the guest) is available for join tests.

## TC1 - Join Form Renders Correctly
1. Log in as the guest user.
2. Navigate to the join-trip page.

Expected:
- Page shows an input field for the invite code.
- Page shows an input field for the room username.
- A Join button is visible.
- No console errors appear.

## TC2 - Successful Join via Valid Invite Code
1. Log in as the guest user.
2. Navigate to the join-trip page.
3. Enter the valid invite code from the host's trip.
4. Enter a unique room username (e.g. `TravelBuddy`).
5. Click Join.

Expected:
- Guest is redirected to the trip room page of that trip.
- Guest's chosen room username `TravelBuddy` appears in the participant list.
- Host's real account username appears in the participant list.
- Guest sees a You badge next to their own name.

## TC3 - Invalid Invite Code Shows Error
1. Log in as the guest user.
2. Navigate to the join-trip page.
3. Enter a non-existent invite code (e.g. `INVALID99`).
4. Enter a room username.
5. Click Join.

Expected:
- Error message is displayed (e.g. "Trip not found" or "Invalid invite code").
- User remains on the join page and is not redirected.

## TC4 - Duplicate Membership Is Rejected
1. Log in as a guest user who has already joined the trip.
2. Navigate to the join-trip page.
3. Enter the same invite code and any room username.
4. Click Join.

Expected:
- Error message is displayed (e.g. "Already a member of this trip").
- No duplicate membership is created.

## TC5 - Duplicate Room Username Is Rejected
1. Ensure another user has already joined with room username `Explorer`.
2. Log in as a different guest user.
3. Navigate to the join-trip page.
4. Enter the valid invite code and room username `Explorer`.
5. Click Join.

Expected:
- Error message is displayed (e.g. "Room username already taken").
- The second guest is not added to the trip.

## TC6 - Closed or Finalized Trip Rejects Join
1. Ensure the host has finalized or closed the trip.
2. Log in as a new guest who has not yet joined.
3. Navigate to the join-trip page.
4. Enter the invite code and a room username.
5. Click Join.

Expected:
- Error message is displayed (e.g. "This trip is already closed").
- User is not added as a participant.

## TC7 - Empty Fields Validation
1. Navigate to the join-trip page.
2. Click Join without entering any data.
3. Then enter only an invite code, leave room username empty, and click Join.

Expected:
- Validation error is shown for each missing field.
- No join request is submitted to the backend.

## TC8 - Participant List Updates After Joining
1. Ensure a trip already has a host and one other guest.
2. Log in as a new guest.
3. Join the trip with room username `Wanderer`.
4. After redirect, view the participants section.

Expected:
- All participants are shown: host (with account username), existing guest (with room username), and `Wanderer`.
- The newly joined user sees a You badge next to `Wanderer`.
