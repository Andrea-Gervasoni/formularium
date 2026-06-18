// ============================================================================
// FORMULARIUM — Google Apps Script per le recensioni
// ============================================================================
// ISTRUZIONI:
//   1. Apri Google Drive → Nuovo → Fogli Google → rinomina "Formularium Reviews"
//   2. Crea le colonne nella riga 1:
//      A: Timestamp  B: Stelle  C: Lingua  D: Data
//   3. Nel foglio: Estensioni → Apps Script → cancella il codice di default
//      e incolla tutto questo file → Salva (Ctrl+S)
//   4. Clicca "Deploy" → "New deployment"
//      - Type: Web app
//      - Execute as: Me
//      - Who has access: Anyone
//      Clicca "Deploy" → copia il Web app URL
//   5. Incolla l'URL in assets/app.js nel blocco CONFIG:
//      REVIEWS_SHEET_URL: 'https://script.google.com/macros/s/XXX/exec'
// ============================================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const now = new Date();
    sheet.appendRow([
      now.toISOString(),        // A: Timestamp ISO
      data.rating || 0,         // B: Stelle (1-5)
      data.lang || 'it',        // C: Lingua (it/en)
      Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') // D: Data leggibile
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET handler (test: apri l'URL nel browser per verificare che funzioni)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Formularium Reviews script is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
