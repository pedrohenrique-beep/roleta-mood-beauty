/**
 * Roleta Mood Beauty — recebe os cadastros da roleta e grava na planilha.
 * Cole este código em Extensões → Apps Script da planilha de leads
 * e implante como App da Web (Executar como: Eu · Acesso: Qualquer pessoa).
 *
 * API de Conversões da Meta: o token NÃO fica neste código.
 * Cadastre em Configurações do projeto → Propriedades do script:
 *   META_PIXEL_ID   → ID do pixel
 *   META_TOKEN      → token de acesso da API de Conversões
 *   META_TEST_CODE  → (opcional, só durante testes) código de "Testar eventos"
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

    try { enviarLeadMeta(dados, whatsapp); } catch (errMeta) { console.error('Meta CAPI', errMeta); }
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

// ---------- Meta: API de Conversões ----------

function enviarLeadMeta(dados, whatsapp) {
  const props = PropertiesService.getScriptProperties();
  const pixel = props.getProperty('META_PIXEL_ID');
  const token = props.getProperty('META_TOKEN');
  if (!pixel || !token) return;

  const primeiroNome = String(dados.nome || '').trim().split(/\s+/)[0].toLowerCase();
  const userData = {
    ph: [sha256(whatsapp)],
    external_id: [sha256(whatsapp)],
    country: [sha256('br')]
  };
  if (primeiroNome) userData.fn = [sha256(primeiroNome)];
  if (dados.fbp) userData.fbp = String(dados.fbp);
  if (dados.fbc) userData.fbc = String(dados.fbc);
  if (dados.ua) userData.client_user_agent = String(dados.ua).slice(0, 400);

  const evento = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(dados.codigo || ''),          // mesmo ID do pixel → a Meta não conta em dobro
    action_source: 'website',
    event_source_url: String(dados.url || ''),
    user_data: userData,
    custom_data: { content_name: dados.premio || '', origem: dados.origem || 'direto' }
  };

  const corpo = { data: [evento] };
  const teste = props.getProperty('META_TEST_CODE');
  if (teste) corpo.test_event_code = teste;

  const r = UrlFetchApp.fetch('https://graph.facebook.com/v23.0/' + pixel + '/events?access_token=' + encodeURIComponent(token), {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(corpo),
    muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) console.error('Meta CAPI ' + r.getResponseCode() + ': ' + r.getContentText());
}

function sha256(texto) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(texto), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

// Rode esta função UMA vez no editor para autorizar o envio à Meta e testar a conexão.
function testarMeta() {
  enviarLeadMeta({
    nome: 'Teste Roleta', codigo: 'TESTE-' + Date.now(), premio: 'Teste', origem: 'teste',
    url: 'https://roleta-mood-beauty.vercel.app/'
  }, '5531900000000');
  console.log('Enviado. Confira em Gerenciador de Eventos → Testar eventos (se META_TEST_CODE estiver preenchido).');
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
