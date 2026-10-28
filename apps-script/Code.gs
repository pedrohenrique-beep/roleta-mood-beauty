/**
 * Roleta Mood Beauty — recebe os cadastros da roleta e grava na planilha.
 * Cole este código em Extensões → Apps Script da planilha de leads
 * e implante como App da Web (Executar como: Eu · Acesso: Qualquer pessoa).
 */

const ABA = 'Leads';
const CABECALHO = ['Data', 'Nome', 'WhatsApp', 'Prêmio', 'Código', 'Origem', 'Status do resgate', 'Observações'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const dados = JSON.parse(e.postData.contents);
    const whatsapp = String(dados.whatsapp || '').replace(/\D/g, '');
    if (!dados.nome || whatsapp.length < 12) {
      return resposta({ ok: false, erro: 'dados_invalidos' });
    }

    const aba = obterAba();
    const jaGirou = aba.getRange('C:C').createTextFinder(whatsapp).matchEntireCell(true).findNext();
    if (jaGirou) {
      return resposta({ ok: false, erro: 'ja_girou' });
    }

    aba.appendRow([
      new Date(),
      String(dados.nome).slice(0, 80),
      whatsapp,
      dados.premio || '',
      dados.codigo || '',
      dados.origem || 'direto',
      'Pendente',
      ''
    ]);
    return resposta({ ok: true });
  } catch (err) {
    return resposta({ ok: false, erro: 'falha_servidor' });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return resposta({ ok: true, status: 'Roleta Mood Beauty ativa' });
}

function obterAba() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(ABA);
  if (!aba) {
    aba = planilha.getSheets()[0];
    aba.setName(ABA);
  }
  if (aba.getLastRow() === 0) {
    aba.appendRow(CABECALHO);
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
    aba.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
    aba.getRange('C:C').setNumberFormat('@');
    const regra = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Pendente', 'Contatado', 'Agendado', 'Compareceu', 'Sem resposta'], true)
      .build();
    aba.getRange('G2:G').setDataValidation(regra);
  }
  return aba;
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
