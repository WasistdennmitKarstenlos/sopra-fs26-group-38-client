# US-01 Manual Test Cases

## Scope
User registration flow:
- User can register with username, password, and bio
- Successful registration logs the user in automatically
- Successful registration redirects to the dashboard
- Registration fails for empty required fields or duplicate username
- User can log out and later log back in
- Creation date is stored for the new user

## Preconditions
- Backend server is running.
- Frontend app is running.
- No session token is stored for the browser, or the user is logged out.
- At least one test user exists for duplicate-username testing.

## TC1 - Registration Form Is Available
1. Open the registration page.
2. Inspect the form fields.

Expected:
- Username field is visible.
- Password field is visible.
- Bio field is visible.
- Register button is visible.

## TC2 - Successful Registration Redirects to Dashboard
1. Open the registration page.
2. Enter a new unique username.
3. Enter a valid password.
4. Enter a short bio.
5. Click `Register`.

Expected:
- Registration succeeds.
- The user is automatically logged in.
- The user is redirected to the dashboard.
- Login state is stored in the browser.

## TC3 - Registered User Can Access Trip Planning Features
1. Complete a successful registration.
2. Inspect the dashboard after the redirect.

Expected:
- The user is treated as logged in.
- Trip planning features that require authentication are accessible.

## TC4 - Duplicate Username Is Rejected
1. Open the registration page.
2. Enter a username that is already taken.
3. Enter a password and a bio.
4. Click `Register`.

Expected:
- Registration fails.
- An error message is shown.
- The user remains on the registration screen.
- No new account is created.

## TC5 - Empty Required Fields Are Rejected
1. Open the registration page.
2. Leave username empty and fill only password and bio.
3. Click `Register`.

Expected:
- Registration fails.
- An error message is shown.
- The user remains on the registration screen.

4. Repeat with password empty and username filled.

Expected:
- Registration fails again.
- An error message is shown.

## TC6 - Bio Can Be Filled and Stored
1. Open the registration page.
2. Enter a new unique username.
3. Enter a valid password.
4. Enter a short bio such as `I love city trips`.
5. Register successfully.

Expected:
- Registration succeeds.
- The bio value is stored with the user profile.

## TC7 - Creation Date Is Persisted
1. Create a new user account.
2. Inspect the user record through the backend or profile data if available.

Expected:
- The user has a creation date stored in the database.
- The creation date is not empty.

## TC8 - User Can Log Out and Log Back In
1. Register a new user successfully.
2. Log out.
3. Log in again with the same credentials.

Expected:
- Logout succeeds.
- The user can log back in with the same account.
- The session is restored after login.

## TC9 - Failed Registration Keeps User on Registration Flow
1. Enter an invalid or duplicate registration.
2. Submit the form.

Expected:
- The user stays on or is returned to the registration screen.
- The error is visible.
- No automatic login happens.

## Notes
- For TC4 and TC5, verify that the error message is clear and the form can still be edited afterward.
- For TC7, use backend inspection, database access, or an existing admin/debug view if the profile UI does not expose the creation date directly.