# Roteiro de Lubrificação (simples)

Pequena aplicação em HTML/CSS/JS para registrar lubrificações de equipamentos localmente no navegador.

Funcionalidades:
- Adicionar registro: equipamento, patrimônio, período, óleo/graxa, data realizada e observações.
- Editar e excluir registros.
- Filtro por período e busca por equipamento/patrimônio.
- Persistência local usando `localStorage`.
- Exportar todos os registros em CSV.

Como usar:
1. Abra `index.html` em um navegador (arraste para o navegador ou clique duas vezes).
2. Preencha o formulário e clique em "Adicionar".
3. Use a tabela para editar/excluir ou exportar os registros.

Observações e próximos passos:
- Arquivo salvo apenas localmente (sem servidor). Para sincronização entre máquinas é preciso um backend.
- Melhorias: impressão/PDF, autenticação, importação CSV, validação mais robusta, filtros por período automáticos.

Desenvolvido rapidamente como protótipo. Boa manutenção e adaptações futuras!