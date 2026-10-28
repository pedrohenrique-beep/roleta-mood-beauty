# Roleta Mood Beauty

Roleta premiada da Mood Beauty (Savassi, BH) para captação de leads via tráfego pago e disparo para a base.

## Onde alterar

Tudo está em `index.html`:

- **Prêmios e chances**: array `PRIZES` no início do `<script>` (campo `w` = peso em %).
- **Cores e fontes**: bloco `:root` no início do `<style>`.
- **Textos**: seção `.hero` e o formulário no HTML.
- **Link de agendamento**: botão "Agendar meu horário" (hoje aponta para bit.ly/moodbeautybh).
- **Validade do cupom**: textos "15 dias" no HTML.

## Pendente

- [ ] Colar a URL do App da Web em `SHEETS_URL` (index.html)

- [ ] Pixel da Meta (PageView + Lead)

## Integração com a planilha

O script está em `apps-script/Code.gs`. Ele grava cada giro na aba **Leads**, bloqueia WhatsApp repetido e cria a coluna **Status do resgate** para o time acompanhar.

## Links por origem

- Tráfego pago: `?origem=trafego`
- Disparo para clientes: `?origem=clientes`

## Deploy

Projeto estático. Na Vercel: Add New → Project → importar este repositório → Deploy (sem build).
