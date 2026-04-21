# US-03 Manual Test Cases

## Preconditions
- Backend server is running.
- Frontend app is running.
- At least two test users exist.
- One user has at least one created trip.
- One user has no trips for empty-state testing.

## TC1 - Dashboard Page Loads for Authenticated User
1. Log in with a valid user account.
2. Confirm redirect to the dashboard page.

Expected:
- Dashboard page opens without errors.
- Trip overview sections are visible.

## TC2 - Trip List Is Fetched from Backend
1. Log in as a user who has trips.
2. Open the dashboard page.
3. Wait until loading is complete.

Expected:
- Trip entries are loaded from backend data.
- No mock or placeholder-only list is shown.

## TC3 - Trip Entry Shows Name, Status, and Creation Date
1. Open the dashboard as a user with trips.
2. Inspect one trip card in My Trips or Shared Trips.

Expected:
- Trip name is visible.
- Trip status is visible.
- Creation date is visible.

## TC4 - My Trips and Shared Trips Separation
1. Log in as a user who hosts one trip and joined another.
2. Open the dashboard.

Expected:
- Hosted trip appears under My Trips.
- Joined trip appears under Shared Trips.

## TC5 - Empty State for User Without Trips
1. Log in as a user with no created or joined trips.
2. Open the dashboard page.

Expected:
- Empty-state message is shown.
- No trip cards are displayed.

## TC6 - Trip Entry Is Clickable and Opens Detail Page
1. Log in as a user with at least one trip.
2. Click a trip card in the dashboard.

Expected:
- User is redirected to the corresponding trip detail page.
- URL contains the selected trip id.

## TC7 - Unauthorized Access Redirect Behavior
1. Clear stored auth token or open app in a logged-out state.
2. Try to navigate to the dashboard page.

Expected:
- User is redirected to login.
- Dashboard data is not shown.

## TC8 - Backend Authorization Error Handling
1. Log in normally.
2. In browser dev tools, remove or invalidate the auth token.
3. Refresh dashboard page.

Expected:
- Trip list request is rejected by backend authorization.
- Frontend does not crash and shows an error state or redirects to login.
