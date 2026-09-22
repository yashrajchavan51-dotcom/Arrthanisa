/**
 * ARTHANISA DESIGN STUDIO — enquiry logger
 *
 * Paste this into a Google Apps Script project bound to a Google Sheet.
 * Every website enquiry becomes one row in the sheet AND one formatted
 * email to the studio. Free, no submission limit, and the sheet is a
 * permanent record the studio can sort, filter and annotate.
 *
 * Step-by-step setup is in README-form-setup.txt (same folder).
 */

// ---- settings -------------------------------------------------------
var NOTIFY_TO   = 'yashrajchavan5143@gmail.com';   // who gets the enquiry email
var NOTIFY_CC   = '';   // add the studio's own address here when it's ready, or ''
var SHEET_NAME  = 'Enquiries';
var STUDIO_NAME = 'Arthanisa Design Studio';

// Column order in the sheet. The first four are filled from the form;
// "Status" and "Notes" are left blank for the studio to work in.
var HEADERS = [
  'Received',
  'Full Name',
  'Email Address',
  'Phone Number',
  'Project Type',
  'Message',
  'Status',
  'Notes'
];
// ---------------------------------------------------------------------


function doPost(e) {
  // One at a time, so two enquiries a second apart can't overwrite
  // each other's row.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var f = (e && e.parameter) ? e.parameter : {};

    // honeypot: a real person never fills this in
    if (f.botcheck) {
      return json({ ok: true, skipped: 'spam' });
    }

    var sheet = getSheet();
    var received = Utilities.formatDate(
      new Date(), 'Asia/Kolkata', 'dd MMM yyyy, HH:mm'
    );

    var row = [
      received,
      f['Full Name']     || '',
      f['Email Address'] || '',
      f['Phone Number']  || '',
      f['Project Type']  || 'Not specified',
      f['Message']       || '',
      'New',
      ''
    ];
    sheet.appendRow(row);

    sendNotification(row);
    return json({ ok: true });

  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}


function doGet() {
  return json({ ok: true, message: 'Arthanisa enquiry endpoint is live.' });
}


function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // first run: lay out the header row
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    var head = sheet.getRange(1, 1, 1, HEADERS.length);
    head.setFontWeight('bold')
        .setBackground('#102A3E')
        .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);   // Received
    sheet.setColumnWidth(2, 170);   // Name
    sheet.setColumnWidth(3, 210);   // Email
    sheet.setColumnWidth(4, 140);   // Phone
    sheet.setColumnWidth(5, 130);   // Project type
    sheet.setColumnWidth(6, 420);   // Message
    sheet.getRange('F:F').setWrap(true);
  }
  return sheet;
}


function sendNotification(row) {
  var name  = row[1] || 'Website visitor';
  var email = row[2];
  var type  = row[4];

  var subject = 'Enquiry — ' + type + ' — ' + name;

  var rows = '';
  for (var i = 0; i < 6; i++) {
    rows +=
      '<tr>' +
        '<td style="padding:8px 14px 8px 0;vertical-align:top;color:#5A6673;' +
        'font:400 12px/1.5 Helvetica,Arial,sans-serif;text-transform:uppercase;' +
        'letter-spacing:.08em;white-space:nowrap">' + HEADERS[i] + '</td>' +
        '<td style="padding:8px 0;vertical-align:top;color:#16202B;' +
        'font:400 15px/1.55 Helvetica,Arial,sans-serif">' +
        escapeHtml(row[i] || '—').replace(/\n/g, '<br>') + '</td>' +
      '</tr>';
  }

  var html =
    '<div style="max-width:620px;margin:0 auto;padding:28px 24px;' +
    'font-family:Helvetica,Arial,sans-serif">' +
      '<p style="margin:0 0 4px;font-size:12px;letter-spacing:.18em;' +
      'text-transform:uppercase;color:#1D4E73">New website enquiry</p>' +
      '<h2 style="margin:0 0 20px;font-size:22px;color:#16202B;font-weight:600">' +
        escapeHtml(name) + ' &mdash; ' + escapeHtml(type) +
      '</h2>' +
      '<table cellpadding="0" cellspacing="0" style="width:100%;' +
      'border-top:1px solid #DCE2E8">' + rows + '</table>' +
      (email
        ? '<p style="margin:24px 0 0"><a href="mailto:' + encodeURI(email) +
          '" style="display:inline-block;padding:12px 22px;background:#1D4E73;' +
          'color:#fff;text-decoration:none;font-size:13px;letter-spacing:.08em;' +
          'text-transform:uppercase">Reply to ' + escapeHtml(name) + '</a></p>'
        : '') +
      '<p style="margin:28px 0 0;font-size:12px;color:#8398A8">' +
        'Logged to the ' + SHEET_NAME + ' sheet &middot; sent from the ' +
        STUDIO_NAME + ' website.' +
      '</p>' +
    '</div>';

  var options = {
    to: NOTIFY_TO,
    subject: subject,
    htmlBody: html,
    name: STUDIO_NAME + ' website'
  };
  if (email) options.replyTo = email;   // hit Reply and it reaches the enquirer
  if (NOTIFY_CC) options.cc = NOTIFY_CC;

  MailApp.sendEmail(options);
}


function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


function escapeHtml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


/**
 * Run this once from the Apps Script editor to check the whole chain:
 * it writes a test row and sends you the email.
 */
function runTest() {
  doPost({ parameter: {
    'Full Name': 'Test Enquiry',
    'Email Address': 'test@example.com',
    'Phone Number': '+91 90000 00000',
    'Project Type': 'Residential',
    'Message': 'This is a test submission.\nSecond line, to check wrapping.'
  }});
}
