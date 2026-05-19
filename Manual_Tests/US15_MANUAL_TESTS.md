# US-15 Manual Test Cases

## Scope
Final report flow for finalized trips:
- Host can trigger Final Evaluation and make the final report available
- Participants can open and download the report
- Report shows the winning destination, activities, comments, and vote outcome
- Report is only available for finalized trips
- Non-participants cannot access the report

## Preconditions
- Backend server is running.
- Frontend app is running.
- User A is the host of a trip.
- User B is a participant of the same trip.
- User C is not a participant of the trip.
- The trip has at least two destinations.
- Each destination has activities with votes and at least one activity comment.
- The trip can be finalized and has a clear winning destination.

## TC1 - Host Can Trigger Final Evaluation
1. Log in as User A, the host.
2. Open the trip room.
3. Trigger Final Evaluation.

Expected:
- The trip enters final evaluation mode.
- A winner is determined.
- The finalized trip view becomes available.

## TC2 - Final Report Becomes Available After Finalization
1. As the host, finalize the trip.
2. Open the finalized trip view.

Expected:
- A report action such as `View Report` or `Download` is visible.
- The final report can be opened.
- No report action is shown before the trip is finalized.

## TC3 - Participant Can Open the Final Report
1. Log in as User B, a participant of the trip.
2. Open the same finalized trip.
3. Click the report action.

Expected:
- The final report opens successfully.
- The report is readable and clearly structured.
- The report content is accessible to the participant.

## TC4 - Winning Destination Is Displayed Prominently
1. Open the final report.
2. Inspect the top section of the report.

Expected:
- The winning destination name is displayed prominently.
- The room code or trip metadata may also be shown.

## TC5 - Report Includes Winning Destination Activities
1. Open the final report.
2. Inspect the activities section.

Expected:
- The activities belonging to the winning destination are listed.
- Each activity entry shows its name.
- Activity details such as address and rating are shown when available.

## TC6 - Report Includes Comments and Final Vote Outcome
1. Open the final report.
2. Inspect at least one activity that has comments and votes.

Expected:
- Relevant comments for the activity are included or otherwise visible in the report data.
- Upvotes, downvotes, and score information are shown for each listed activity.
- The final popularity or ranking order is reflected in the report.

## TC7 - Report Can Be Downloaded
1. Open the final report as a participant.
2. Click `Download`.

Expected:
- A file download starts successfully.
- The downloaded report is readable and matches the on-screen content.
- The file contains the winning destination name and activity summary.

## TC8 - Report Is Not Available Before Finalization
1. Open a trip that has not been finalized yet.
2. Look for the report action.

Expected:
- No final report can be opened.
- The report action is hidden or disabled.
- If the report modal is opened through any route, an error or empty state is shown.

## TC9 - Non-Participant Cannot Access the Report
1. Log in as User C, who is not part of the trip.
2. Try to open the finalized trip or access the report flow directly.

Expected:
- The trip report is not accessible.
- The user is denied access, redirected, or shown an error state.
- No report data is displayed.

## Notes
- For TC6, verify both the on-screen report and the downloaded file if possible.
- If the report is empty, ensure the empty state is shown clearly instead of a broken view.
- For TC8 and TC9, verify the behavior with a page refresh as well.