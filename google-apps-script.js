// ─────────────────────────────────────────────────────────────────────────────
// InterviewAI — Google Apps Script Webhook
// Paste this entire file into Tools > Script editor in your Google Sheet,
// then deploy as a Web App (Execute as: Me, Access: Anyone).
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_NAME = 'Interviews';

// 🔐 Secret token — must match VITE_SHEETS_TOKEN in your .env.local
// Change this to any random string you like (e.g. "mySecretKey123")
const SECRET_TOKEN = 'CHANGE_ME_TO_SOMETHING_RANDOM';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Header row
    sheet.appendRow([
      'Session ID', 'Name', 'Topic', 'Category', 'Question Type',
      'Experience (YOE)', 'Questions', 'Start Time',
      'Score', 'Max Score', 'Percentage', 'Grade', 'Verdict', 'Status'
    ]);
    // Style header
    const header = sheet.getRange(1, 1, 1, 14);
    header.setBackground('#1a1a2e');
    header.setFontColor('#ffffff');
    header.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 🔐 Reject requests without the correct token
    if (data.token !== SECRET_TOKEN) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const sheet = getOrCreateSheet();

    if (data.action === 'create') {
      sheet.appendRow([
        data.sessionId,
        data.name,
        data.topic,
        data.category,
        data.qType === 'mcq' ? 'Multiple Choice' : 'Short Answer',
        data.experience,
        data.numQ,
        data.startTime,
        '', '', '', '', '',   // score fields — filled on update
        'In Progress'
      ]);
    }

    if (data.action === 'update') {
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(data.sessionId)) {
          sheet.getRange(i + 1, 9).setValue(data.score);
          sheet.getRange(i + 1, 10).setValue(data.maxScore);
          sheet.getRange(i + 1, 11).setValue(data.percentage + '%');
          sheet.getRange(i + 1, 12).setValue(data.grade);
          sheet.getRange(i + 1, 13).setValue(data.verdict);
          sheet.getRange(i + 1, 14).setValue('Completed');

          // Color the grade cell
          const gradeColors = { S: '#7c3aed', A: '#34d399', B: '#60a5fa', C: '#fbbf24', D: '#f87171' };
          const gradeCell = sheet.getRange(i + 1, 12);
          gradeCell.setBackground(gradeColors[data.grade] || '#888');
          gradeCell.setFontColor('#ffffff');
          gradeCell.setFontWeight('bold');
          break;
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run this manually to verify the sheet is set up correctly
function testSetup() {
  getOrCreateSheet();
  Logger.log('Sheet ready!');
}
