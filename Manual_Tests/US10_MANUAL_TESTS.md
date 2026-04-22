# US-10 Manual Test Cases

## Preconditions
- Backend server is running with a valid `GOOGLE_MAPS_API_KEY`.
- Frontend app is running and user is logged in.
- A trip room exists and can be opened.

## TC1 - Add and Select Destination
1. Open a trip room page.
2. In the destination section, enter a destination name and click `Add Destination`.
3. Click the destination card that appears.

Expected:
- Destination appears in the list.
- Selected destination is visually highlighted.

## TC2 - Search Activity Suggestions
1. Select a destination card.
2. Enter keyword `museum` in activity search.
3. Click `Search`.

Expected:
- Suggestions list appears.
- Each item shows activity details and optional image.

## TC3 - Add Activity to Destination
1. From search results, click `Add to destination` on one item.

Expected:
- Success feedback appears.
- Chosen activity is shown in `Chosen activities` for the selected destination.
- Activity remains after page refresh.

## TC4 - Edit Selected Activity
1. In chosen activities, click `Rename`.
2. Enter a new name and confirm.

Expected:
- Activity name updates immediately.
- Updated name remains after page refresh.

## TC5 - Delete Selected Activity
1. In chosen activities, click `Remove`.

Expected:
- Activity disappears from the list.
- Deleted activity does not reappear after refresh.

## TC6 - Validation and Empty States
1. Click `Search` with empty keyword.
2. Use an uncommon keyword producing no results.

Expected:
- Empty keyword shows validation message.
- No-result search shows an informative state without crashing.