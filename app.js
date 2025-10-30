// app.js - lógica para gerenciar registros de lubrificação (localStorage)
const STORAGE_KEY = 'lubrificacaoEntries_v2'; // Incrementado para nova versão com componentes
let entries = [];
let editId = null;
let currentComponents = []; // array para componentes do registro atual

// elementos
const lubForm = document.getElementById('lubForm');
const equipamentoEl = document.getElementById('equipamento');
const patrimonioEl = document.getElementById('patrimonio');
const periodoEl = document.getElementById('periodo');
const dataRealizadaEl = document.getElementById('data_realizada');
const observacoesEl = document.getElementById('observacoes');

// elementos de componentes
const componentTypeEl = document.getElementById('componentType');
const componentQtyEl = document.getElementById('componentQty');
const componentLubEl = document.getElementById('componentLub');
const componentDescEl = document.getElementById('componentDesc');
const addComponentBtn = document.getElementById('addComponentBtn');
const componentsListEl = document.getElementById('componentsList');
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
  setTimeout(() => { currentComponents = []; renderComponents(); }, 100); // só zera após salvar
  renderComponents();
  saveBtn.textContent = 'Adicionar';
}

function validateForm() {
  if (!equipamentoEl.value.trim()) return 'Informe o equipamento.';
  if (!patrimonioEl.value.trim()) return 'Informe o patrimônio.';
  if (!periodoEl.value.trim()) return 'Informe o período.';
  if (!dataRealizadaEl.value) return 'Informe a data realizada.';
  if (currentComponents.length === 0) return 'Adicione pelo menos um componente.';
  return null;
}

// Funções para gerenciar componentes
function addComponent() {
  const type = componentTypeEl.value;
  const qty = componentQtyEl.value;
  const lub = componentLubEl.value;
  const desc = componentDescEl.value;

  if (!type) return alert('Selecione o tipo de componente.');
  if (!qty || qty < 1) return alert('Informe uma quantidade válida.');
  if (!lub) return alert('Informe o tipo de lubrificante.');

  const component = {
    id: Date.now().toString(),
    type,
    qty: parseInt(qty, 10),
    lub,
    desc
  };

  currentComponents.push(component);
  renderComponents();
  clearComponentForm();
}

function removeComponent(id) {
  currentComponents = currentComponents.filter(c => c.id !== id);
  renderComponents();
}

function renderComponents() {
  componentsListEl.innerHTML = currentComponents.map(c => `
    <div class="component-tag">
      <span class="qty">${c.qty}x</span>
      <strong>${c.type}</strong>
      <span>${c.lub}</span>
      ${c.desc ? `<em>(${escape(c.desc)})</em>` : ''}
      <span class="remove" onclick="removeComponent('${c.id}')">&times;</span>
    </div>
  `).join('');
}

function clearComponentForm() {
  componentTypeEl.value = '';
  componentQtyEl.value = '';
  componentLubEl.value = '';
  componentDescEl.value = '';
}

function calculateProximaData(dataRealizada, periodo) {
  if (!dataRealizada || !periodo) return '';
  
  const date = new Date(dataRealizada);
  const periodoLower = periodo.toLowerCase().trim();
  
  if (periodoLower.includes('semanal')) {
    date.setDate(date.getDate() + 7);
  } else if (periodoLower.includes('mensal')) {
    date.setMonth(date.getMonth() + 1);
  } else if (periodoLower.includes('trimestral')) {
    date.setMonth(date.getMonth() + 3);
  } else if (periodoLower.includes('semestral')) {
    date.setMonth(date.getMonth() + 6);
  } else if (periodoLower.includes('anual')) {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    // Tenta extrair números do período (ex: "3 meses" => 3)
    const match = periodo.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (periodoLower.includes('mes') || periodoLower.includes('mês')) {
        date.setMonth(date.getMonth() + num);
      } else if (periodoLower.includes('semana')) {
        date.setDate(date.getDate() + (num * 7));
      } else if (periodoLower.includes('dia')) {
        date.setDate(date.getDate() + num);
      }
    }
  }
  
  return date.toISOString().split('T')[0];
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
    data_realizada: dataRealizadaEl.value,
    observacoes: observacoesEl.value.trim(),
    components: JSON.parse(JSON.stringify(currentComponents)), // garantir cópia
    updatedAt: new Date().toISOString()
  };
  console.log('Salvando registro:', entry);

  if (editId) {
    entries = entries.map(en => en.id === editId ? entry : en);
  } else {
    entries.unshift(entry); // adicionar no topo
  }

  saveStorage();
  render();
  resetForm();
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
    const mainRow = document.createElement('tr');
    mainRow.setAttribute('data-id', en.id);
    
    const proximaData = calculateProximaData(en.data_realizada, en.periodo);
    
    mainRow.innerHTML = `
      <td data-label="Equipamento">${escape(en.equipamento)}</td>
      <td data-label="Patrimônio">${escape(en.patrimonio)}</td>
      <td data-label="Período">${escape(en.periodo)}</td>
      <td data-label="Data realizada">${formatDate(en.data_realizada)}</td>
      <td data-label="Próxima Data">${formatDate(proximaData)}</td>
      <td data-label="Ações">
        <button type="button" class="toggle-details" title="Mostrar/ocultar detalhes">▼</button>
        <button data-id="${en.id}" class="edit">Editar</button>
        <button data-id="${en.id}" class="delete">Excluir</button>
      </td>
    `;

    const detailsRow = document.createElement('tr');
    detailsRow.classList.add('row-details');
    detailsRow.innerHTML = `
      <td colspan="6">
        <div class="component-list-view">
          <h3>Componentes</h3>
          ${en.components && en.components.length > 0 ? `
            <div class="component-items">
              ${en.components.map(comp => `
                <div class="component-item-view">
                  <div class="title">${comp.qty}x ${escape(comp.type)}</div>
                  <div class="meta">
                    <span>Lubrificante: ${escape(comp.lub)}</span>
                    ${comp.desc ? `<span>Obs: ${escape(comp.desc)}</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<p>Nenhum componente registrado</p>'}
          ${en.observacoes ? `
            <div class="observacoes">
              <h4>Observações gerais</h4>
              <p>${escape(en.observacoes)}</p>
            </div>
          ` : ''}
        </div>
      </td>
    `;

    entriesTableBody.appendChild(mainRow);
    entriesTableBody.appendChild(detailsRow);

    // Adiciona evento para toggle de detalhes
    const toggleBtn = mainRow.querySelector('.toggle-details');
    toggleBtn.addEventListener('click', () => {
      const currentRow = toggleBtn.closest('tr');
      const detailsRow = currentRow.nextElementSibling;
      const isExpanded = detailsRow.style.display === 'table-row';
      
      detailsRow.style.display = isExpanded ? 'none' : 'table-row';
      toggleBtn.textContent = isExpanded ? '▼' : '▲';
      toggleBtn.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    });
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
  dataRealizadaEl.value = en.data_realizada;
  observacoesEl.value = en.observacoes || '';
  currentComponents = [...(en.components || [])];
  renderComponents();
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
    ['Equipamento','Patrimônio','Período','Componentes','Data realizada','Próxima Data','Observações']
  ];
  for (const en of entries) {
    const proximaData = calculateProximaData(en.data_realizada, en.periodo);
    const componentesStr = en.components ? en.components.map(c => 
      `${c.qty}x ${c.type} (${c.lub})${c.desc ? ` - ${c.desc}` : ''}`
    ).join('; ') : '-';
    rows.push([
      en.equipamento, 
      en.patrimonio, 
      en.periodo, 
      componentesStr,
      formatDate(en.data_realizada), 
      formatDate(proximaData),
      en.observacoes || ''
    ]);
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

function formatComponents(components) {
  if (!components || !components.length) return '-';
  return '<ul style="margin: 0; padding-left: 1.2em; list-style-position: inside;">' + components.map(c =>
    `<li><strong>${c.qty}x ${escape(c.type)}:</strong> ${escape(c.lub)}${c.desc ? ` <em>(${escape(c.desc)})</em>` : ''}</li>`
  ).join('') + '</ul>';
}

function formatComponentsCSV(components) {
  if (!components || !components.length) return '-';
  return components.map(c => 
    `${c.qty}x ${c.type} (${c.lub})${c.desc ? ` - ${c.desc}` : ''}`
  ).join('; ');
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
  filtered.sort((a, b) => {
    const nextDateA = calculateProximaData(a.data_realizada, a.periodo);
    const nextDateB = calculateProximaData(b.data_realizada, b.periodo);
    return new Date(nextDateA) - new Date(nextDateB);
  });
  
  const title = 'Roteiro de Lubrificação - Registros';
  const now = new Date();
  const dateStr = now.toLocaleString();

  let rows = '';
  for (const en of filtered) {
    rows += `<tr>` +
      `<td>${escape(en.equipamento)}</td>` +
      `<td>${escape(en.patrimonio)}</td>` +
      `<td>${escape(en.periodo)}</td>` +
      `<td>${formatComponents(en.components)}</td>` +
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
            <th>Componentes</th>
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
addComponentBtn.addEventListener('click', (e) => {
  e.preventDefault();
  addComponent();
});

// inicialização
load();
