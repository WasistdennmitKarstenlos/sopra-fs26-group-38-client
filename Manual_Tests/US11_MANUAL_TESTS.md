# US-11 Manual Test Cases

## Preconditions
- Backend server is running.
- Frontend app is running.
- At least two test users exist.
- Both users have joined the same trip.
- The trip has at least one destination with at least one activity added.

## TC1 - Comment Section Is Visible and Expandable
1. Log in as a user in a trip with activities.
2. Navigate to the trip room.
3. Locate an activity card in a destination.
4. Inspect the activity card for a "Comments" button.

Expected:
- Activity card displays a "Comments" button below the vote controls.
- Comments button shows the current comment count (e.g., "0 comments").

## TC2 - Expand Comments Panel
1. On an activity card, click the "Comments" button.
2. Wait for the comments panel to expand.

Expected:
- Comments panel opens inline below the activity card.
- If no comments exist, shows "No comments yet." message.
- Textarea with placeholder "What are you thinking about this activity?" appears.
- Character counter shows "0/280".

## TC3 - Post Valid Comment
1. Expand the comments panel for an activity.
2. Type a comment with valid content (5-20 characters).
3. Click "Post comment" button.
4. Wait for the submission to complete.

Expected:
- Comment is posted successfully.
- Success message: "Comment added." appears.
- Textarea clears.
- New comment appears in the comments list with username, relative timestamp, and content.
- Comment counter increments.

## TC4 - Empty Comment Rejection
1. Expand the comments panel for an activity.
2. Leave the textarea empty.
3. Click "Post comment" button.

Expected:
- Comment is not posted.
- Error message: "Comment cannot be empty." appears.
- Textarea remains focused.

## TC5 - Whitespace-Only Comment Rejection
1. Expand the comments panel for an activity.
2. Type only spaces or tabs in the textarea.
3. Click "Post comment" button.

Expected:
- Comment is not posted.
- Error message: "Comment cannot be empty." appears.

## TC6 - Maximum Length Boundary (280 Characters)
1. Expand the comments panel for an activity.
2. Type exactly 280 characters (use a generator or copy-paste).
3. Click "Post comment" button.

Expected:
- Comment is posted successfully.
- Success message appears.
- Character counter shows "280/280" before posting.
- Comment appears in the list after posting.

## TC7 - Over-Limit Comment Rejection (281 Characters)
1. Expand the comments panel for an activity.
2. Attempt to type 281 or more characters (maxLength enforcement should prevent this in most modern browsers).
3. If the textarea allows pasting beyond 280 chars, attempt to click "Post comment".

Expected:
- Textarea prevents input beyond 280 characters (maxLength={280} enforced).
- If somehow more than 280 chars are in the textarea, the submit button is disabled.
- Error message on click: "Comment cannot exceed 280 characters." appears if submission is attempted.


