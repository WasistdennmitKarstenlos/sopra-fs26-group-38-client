# US-02 Manual Test Cases

## Scope
Login and logout flow:
- Registered users can log in with username and password
- Invalid credentials show an error and do not log the user in
- Authenticated pages are protected from unauthenticated users
- Logout is available on authenticated screens
- Logout ends the session and redirects to the login page
- Session state persists until logout or timeout

## Preconditions
- Backend server is running.
- Frontend app is running.
- At least one registered user exists.
- At least one user account has valid credentials for login testing.
- The browser starts without an active session, or the user is logged out.

## TC1 - Login Form Is Available
1. Open the login page.
2. Inspect the form fields.

Expected:
- Username field is visible.
- Password field is visible.
- Login button is visible.
- Logout is not visible on the login page.

## TC2 - Successful Login Redirects to Dashboard
1. Open the login page.
2. Enter a valid registered username.
3. Enter the correct password.
4. Click `Login`.

Expected:
- Login succeeds.
- The user is redirected to the dashboard.
- The user is treated as authenticated.
- Session data is stored in the browser.

## TC3 - Authenticated Pages Are Accessible After Login
1. Log in successfully.
2. Open the dashboard or a trip page.

Expected:
- Authenticated pages load normally.
- The user can access trip-related features.

## TC4 - Invalid Credentials Show an Error
1. Open the login page.
2. Enter a valid username with an incorrect password.
3. Click `Login`.

Expected:
- Login fails.
- An error message is displayed.
- The user remains logged out.
- No redirect to the dashboard happens.

## TC5 - Unknown Username Is Rejected
1. Open the login page.
2. Enter a username that is not registered.
3. Enter any password.
4. Click `Login`.

Expected:
- Login fails.
- An error message is displayed.
- The user remains on the login page.

## TC6 - Protected Routes Reject Unauthenticated Users
1. Make sure the browser is logged out.
2. Try to open an authenticated page such as the dashboard or a trip URL directly.

Expected:
- The page is not accessible without a valid session.
- The user is redirected to the login page or shown an access restriction.

## TC7 - Logout Button Is Available on Authenticated Screens
1. Log in successfully.
2. Open an authenticated screen such as the dashboard or a trip room.
3. Inspect the sidebar/user menu.

Expected:
- A `Logout` action is visible on authenticated screens.
- The logout control appears in the user section of the sidebar.

## TC8 - Successful Logout Redirects to Login Page
1. Log in successfully.
2. Click `Logout`.

Expected:
- The session ends.
- The user is redirected to the login page.
- Authenticated data is no longer accessible without logging in again.

## TC9 - Session Persists Until Logout or Timeout
1. Log in successfully.
2. Refresh the page or navigate between authenticated pages.

Expected:
- The user remains logged in while the session is valid.
- No login screen appears during normal navigation.

3. Log out.

Expected:
- The session is cleared.
- The user must log in again to access authenticated pages.

## TC10 - Login After Logout Works Again
1. Log in successfully.
2. Log out.
3. Log in again with the same credentials.

Expected:
- The user can log in again after logout.
- The dashboard loads after the second successful login.

## Notes
- For TC4 and TC5, verify that the error message is clear and the form stays editable.
- For TC6, verify the behavior both by direct URL entry and by using browser refresh on a protected page.
- For TC8 and TC10, check that the browser storage/session state changes as expected if that is part of your review process.