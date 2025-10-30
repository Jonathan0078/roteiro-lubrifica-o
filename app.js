// app.js - lógica para gerenciar registros de lubrificação (localStorage)
const STORAGE_KEY = 'lubrificacaoEntries_v1';
let entries = [];
let editId = null;

// elementos
const lubForm = document.getElementById('lubForm');
const equipamentoEl = document.getElementById('equipamento');
const patrimonioEl = document.getElementById('patrimonio');
const periodoEl = document.getElementById('periodo');
const lubrificanteEl = document.getElementById('lubrificante');
const dataRealizadaEl = document.getElementById('data_realizada');
const observacoesEl = document.getElementById('observacoes');
const entriesTableBody = document.querySelector('#entriesTable tbody');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const printBtn = document.getElementById('printBtn');
const searchEl = document.getElementById('search');
const filterPeriodoEl = document.getElementById('filterPeriodo');

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    entries = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erro ao carregar storage', e);
    entries = [];
  }
  render();
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function resetForm() {
  lubForm.reset();
  editId = null;
  saveBtn.textContent = 'Adicionar';
}

function validateForm() {
  if (!equipamentoEl.value.trim()) return 'Informe o equipamento.';
  if (!patrimonioEl.value.trim()) return 'Informe o patrimônio.';
  if (!periodoEl.value.trim()) return 'Informe o período.';
  if (!lubrificanteEl.value.trim()) return 'Informe o óleo/graxa.';
  if (!dataRealizadaEl.value) return 'Informe a data realizada.';
  return null;
}

function addOrUpdateEntry(e) {
  e.preventDefault();
  const err = validateForm();
  if (err) { alert(err); return; }

  const entry = {
    id: editId || Date.now().toString(),
    equipamento: equipamentoEl.value.trim(),
    patrimonio: patrimonioEl.value.trim(),
    periodo: periodoEl.value.trim(),
    lubrificante: lubrificanteEl.value.trim(),
    data_realizada: dataRealizadaEl.value,
    observacoes: observacoesEl.value.trim(),
    updatedAt: new Date().toISOString()
  };

  if (editId) {
    entries = entries.map(en => en.id === editId ? entry : en);
  } else {
    entries.unshift(entry); // adicionar no topo
  }

  saveStorage();
  resetForm();
  render();
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const periodoFilter = filterPeriodoEl.value;

  const filtered = entries.filter(en => {
    const matchQ = !q || en.equipamento.toLowerCase().includes(q) || en.patrimonio.toLowerCase().includes(q);
    const matchPeriodo = !periodoFilter || en.periodo.toLowerCase().includes(periodoFilter);
    return matchQ && matchPeriodo;
  });

  entriesTableBody.innerHTML = '';
  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7" style="color:#6b7280">Nenhum registro</td>`;
    entriesTableBody.appendChild(tr);
    return;
  }

  for (const en of filtered) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Equipamento">${escape(en.equipamento)}</td>
      <td data-label="Patrimônio">${escape(en.patrimonio)}</td>
      <td data-label="Período">${escape(en.periodo)}</td>
      <td data-label="Óleo/Graxa">${escape(en.lubrificante)}</td>
      <td data-label="Data realizada">${formatDate(en.data_realizada)}</td>
      <td data-label="Observações">${escape(en.observacoes || '')}</td>
      <td data-label="Ações">
        <button data-id="${en.id}" class="edit">Editar</button>
        <button data-id="${en.id}" class="delete">Excluir</button>
      </td>
    `;
    entriesTableBody.appendChild(tr);
  }

  // delegação de eventos para editar/excluir
  entriesTableBody.querySelectorAll('button.edit').forEach(btn => {
    btn.addEventListener('click', () => startEdit(btn.dataset.id));
  });
  entriesTableBody.querySelectorAll('button.delete').forEach(btn => {
    btn.addEventListener('click', () => removeEntry(btn.dataset.id));
  });
}

function startEdit(id) {
  const en = entries.find(x => x.id === id);
  if (!en) return;
  editId = id;
  equipamentoEl.value = en.equipamento;
  patrimonioEl.value = en.patrimonio;
  periodoEl.value = en.periodo;
  lubrificanteEl.value = en.lubrificante;
  dataRealizadaEl.value = en.data_realizada;
  observacoesEl.value = en.observacoes || '';
  saveBtn.textContent = 'Salvar alterações';
  window.scrollTo({top:0, behavior:'smooth'});
}

function removeEntry(id) {
  if (!confirm('Confirma exclusão deste registro?')) return;
  entries = entries.filter(en => en.id !== id);
  saveStorage();
  render();
}

function clearAll() {
  if (!confirm('Apagar todos os registros? Esta ação não pode ser desfeita.')) return;
  entries = [];
  saveStorage();
  render();
}

function exportCSV() {
  if (!entries.length) { alert('Não há registros para exportar.'); return; }
  const rows = [
    ['Equipamento','Patrimônio','Período','Óleo/Graxa','Data realizada','Observações']
  ];
  for (const en of entries) {
    rows.push([en.equipamento, en.patrimonio, en.periodo, en.lubrificante, en.data_realizada, en.observacoes || '']);
  }
  const csv = rows.map(r => r.map(cell => '"' + String(cell).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roteiro_lubrificacao.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// utilitários
function formatDate(d) {
  if (!d) return '';
  try {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString();
  } catch (e) { return d; }
}

function escape(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// listeners
lubForm.addEventListener('submit', addOrUpdateEntry);
clearBtn.addEventListener('click', resetForm);
exportBtn.addEventListener('click', exportCSV);
clearAllBtn.addEventListener('click', clearAll);
// Print only the filtered records in a new window (avoids printing the form/UI)
function getFilteredEntries() {
  const q = searchEl.value.trim().toLowerCase();
  const periodoFilter = filterPeriodoEl.value;
  return entries.filter(en => {
    const matchQ = !q || en.equipamento.toLowerCase().includes(q) || en.patrimonio.toLowerCase().includes(q);
    const matchPeriodo = !periodoFilter || en.periodo.toLowerCase().includes(periodoFilter);
    return matchQ && matchPeriodo;
  });
}

function printRecords() {
  const filtered = getFilteredEntries();
  const title = 'Roteiro de Lubrificação - Registros';
  const now = new Date();
  const dateStr = now.toLocaleString();

  let rows = '';
  for (const en of filtered) {
    rows += `<tr>` +
      `<td>${escape(en.equipamento)}</td>` +
      `<td>${escape(en.patrimonio)}</td>` +
      `<td>${escape(en.periodo)}</td>` +
      `<td>${escape(en.lubrificante)}</td>` +
      `<td>${formatDate(en.data_realizada)}</td>` +
      `<td>${escape(en.observacoes || '')}</td>` +
      `</tr>`;
  }

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body{font-family: Arial, Helvetica, sans-serif;color:#000;margin:20px}
        h1{font-size:18px;margin-bottom:6px}
        .meta{font-size:12px;color:#444;margin-bottom:12px}
        table{width:100%;border-collapse:collapse}
        th,td{padding:8px;border:1px solid #ccc;text-align:left;font-size:12px}
        thead th{background:#f2f4f7}
        @media print{ th,td{font-size:11pt} }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Gerado em: ${dateStr}</div>
      <table>
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Patrimônio</th>
            <th>Período</th>
            <th>Óleo/Graxa</th>
            <th>Data realizada</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6">Nenhum registro</td></tr>'}
        </tbody>
      </table>
    </body>
  </html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Não foi possível abrir a janela de impressão (bloqueador de pop-ups?).'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // Small timeout to ensure render, then print and close
  setTimeout(() => { win.print(); win.close(); }, 300);
}

if (printBtn) printBtn.addEventListener('click', printRecords);
searchEl.addEventListener('input', () => render());
filterPeriodoEl.addEventListener('change', () => render());

// inicialização
load();
