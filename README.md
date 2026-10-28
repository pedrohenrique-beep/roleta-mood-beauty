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

- [ ] Enviar leads para Google Sheets / CRM (hoje ficam só no navegador — ver comentário `// Lead:` no script)
- [ ] Versões separadas para tráfego (`/trafego`) e base de clientes (`/clientes`)
- [ ] Pixel da Meta (PageView + Lead)

## Deploy

Projeto estático. Na Vercel: Add New → Project → importar este repositório → Deploy (sem build).
