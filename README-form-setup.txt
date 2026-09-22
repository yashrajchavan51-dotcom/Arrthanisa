GETTING ENQUIRIES TO THE CLIENT'S INBOX
=======================================

The form has two destinations. They are independent — set up either
one, or both. Whatever is configured receives the submission.

  A.  EMAIL      Web3Forms  -> a formatted email to yashrajchavan5143@gmail.com
  B.  RECORD     Google Sheet -> one row per enquiry, permanent, sortable

Recommendation: do both. A gets it in front of him immediately; B is
what he'll actually work from when there are forty enquiries and he
needs to know which ones were never answered.

Until at least one is configured, the form does NOT fake success —
it tells the visitor to email or call instead. No lead is silently lost.


-------------------------------------------------------------------
A.  EMAIL VIA WEB3FORMS   (5 minutes)
-------------------------------------------------------------------

1. Go to https://web3forms.com
2. Enter yashrajchavan5143@gmail.com and submit. The access key
   arrives by email — no password or dashboard signup needed to start.

   IMPORTANT: with Web3Forms the recipient IS the account email. There
   is no "to" field in the HTML — whichever address you register the
   key against is where enquiries land. So register it against
   yashrajchavan5143@gmail.com, not the studio address.
   To add the studio's own inbox later, link it as a second address in
   the Web3Forms dashboard (the free plan allows up to 3).
   Or use option B, where the recipient is just a line of code.
3. Open contact.html, find:

       <input type="hidden" name="access_key" value="PASTE-YOUR-WEB3FORMS-ACCESS-KEY-HERE">

   Replace the value with the key.
4. Upload and send yourself a test enquiry.

What arrives at yashrajchavan5143@gmail.com: an email listing every field with readable labels
("Full Name", "Email Address", "Phone Number", "Project Type",
"Message"), a subject line reading

       Enquiry — Residential — Priya Sharma

so the inbox sorts and filters itself, and Reply-To set to the
enquirer — he can just hit Reply.

Free plan, as of this writing: 250 submissions a month, up to 3
recipient addresses, custom subject, submissions also listed in the
Web3Forms dashboard. Auto-reply to the enquirer and the built-in
Google Sheets integration are paid features — which is exactly what
option B below replaces, for free. Check current limits and the data
retention setting on their pricing page.


-------------------------------------------------------------------
B.  GOOGLE SHEET LOG + EMAIL   (15 minutes, free, no limits)
-------------------------------------------------------------------

This writes every enquiry into a Google Sheet and sends the email from
the studio's own Google account. It needs no paid plan.

1. Create a new Google Sheet, named e.g. "Arthanisa — Website Enquiries".
2. In that sheet: Extensions > Apps Script.
3. Delete whatever is in Code.gs and paste in the whole of
   google-sheet-Code.gs from this folder.
4. At the top of the file, check NOTIFY_TO. Add a second address in
   NOTIFY_CC if he wants a copy elsewhere.
5. Save, then run the function "runTest" once. Google will ask for
   permission to use the sheet and to send mail on his behalf — that
   prompt is expected, approve it. You'll get a warning screen saying
   the app isn't verified; choose Advanced > Go to (project name).
   Confirm a test row appeared and the email arrived.
6. Deploy > New deployment > type: Web app
       Description:  Arthanisa enquiry endpoint
       Execute as:   Me
       Who has access:  Anyone          <- this matters, not "Anyone with Google account"
   Deploy, then copy the Web app URL. It ends in /exec
7. Open script.js, find near the form section:

       const SHEET_ENDPOINT = '';

   Paste the /exec URL between the quotes.
8. Upload and send a test enquiry from the live site.

The sheet arrives with a frozen, formatted header row and two extra
columns the form never touches — "Status" (pre-filled "New") and
"Notes" — so he can track each enquiry through to a reply. Sort by
Status to see what's outstanding.

Note: whenever you edit the Apps Script you must Deploy > Manage
deployments > edit > New version, or the live URL keeps running the
old code. This catches everyone once.

Gmail sending limits apply: roughly 100 emails/day on a free Google
account, 1,500 on Workspace. Not a constraint here.


-------------------------------------------------------------------
IF SOMETHING DOESN'T ARRIVE
-------------------------------------------------------------------

- Check the spam folder first, and mark the message "not spam" once.
- Open the browser console on the contact page and submit. The script
  logs which destination failed and why. If one destination succeeds
  and the other fails, the visitor still sees a success message and
  the failure is logged as a warning — deliberate, so a broken sheet
  never costs a lead.
- Apps Script returning 401/403 almost always means the deployment
  access is set to "Anyone with Google account" instead of "Anyone".
- Web3Forms returning 400 usually means the access key is wrong or
  still the placeholder.


-------------------------------------------------------------------
ONE THING TO RAISE WITH THE CLIENT
-------------------------------------------------------------------

The form collects names, emails and phone numbers of real people, and
those now sit in his Google account and on Web3Forms' servers. Under
India's DPDP Act 2023 a business collecting personal data should tell
people what it's collected for. A short privacy notice page linked in
the footer covers it — the footer markup for that link is already
commented in place, waiting for the page.
