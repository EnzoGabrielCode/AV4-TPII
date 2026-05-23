interface Acomodacao {
  id: number;
  nome: string;
  desc: string;
  camaSolteiro: number;
  camaCasal: number;
  suite: number;
  clima: boolean;
  garagem: number;
  tipo: 'Solteiro' | 'Casal' | 'Família' | 'Super';
}

interface Cliente {
  nome: string;
  nomeSocial: string;
  nascimento: string;
  tipo: 'titular' | 'dependente';
  cpf: string;
  rg: string;
  telefone: string;
  email: string;
  endereco: string;
  cadastro: string;
}

interface Hospedagem {
  clienteNome: string;
  clienteIdx: number;
  acomodacaoNome: string;
  acomodacaoId: number;
  entrada: string;
  entradaISO: string;
  saidaPrev: string;
  saida: string | null;
  ativo: boolean;
}

interface ActivityItem {
  msg: string;
  time: string;
}

type PageKey = 'dashboard' | 'clientes' | 'acomodacoes' | 'hospedagens' | 'checkout';
type ClienteFilterKey = 'todos' | 'titular' | 'dependente';
type HospFilterKey = 'todas' | 'ativas' | 'encerradas';

const acomodacoes: Acomodacao[] = [
  { id: 1, nome: 'Solteiro Simples', desc: 'Acomodação simples para solteiro(a)',          camaSolteiro: 1, camaCasal: 0, suite: 0, clima: false, garagem: 0, tipo: 'Solteiro' },
  { id: 2, nome: 'Casal Simples',    desc: 'Acomodação simples para casal',                 camaSolteiro: 0, camaCasal: 1, suite: 0, clima: false, garagem: 0, tipo: 'Casal'    },
  { id: 3, nome: 'Família Simples',  desc: 'Família com até 2 crianças',                    camaSolteiro: 2, camaCasal: 1, suite: 0, clima: true,  garagem: 1, tipo: 'Família'  },
  { id: 4, nome: 'Família Mais',     desc: 'Família com até 5 crianças',                    camaSolteiro: 4, camaCasal: 1, suite: 1, clima: true,  garagem: 2, tipo: 'Família'  },
  { id: 5, nome: 'Solteiro Mais',    desc: 'Com garagem para solteiro(a)',                  camaSolteiro: 1, camaCasal: 0, suite: 1, clima: true,  garagem: 1, tipo: 'Solteiro' },
  { id: 6, nome: 'Família Super',    desc: 'Até 2 famílias, casal e 3 crianças cada',       camaSolteiro: 6, camaCasal: 2, suite: 2, clima: true,  garagem: 4, tipo: 'Super'    },
];

let clientes: Cliente[]       = JSON.parse(localStorage.getItem('atlantis_clientes')    || '[]');
let hospedagens: Hospedagem[] = JSON.parse(localStorage.getItem('atlantis_hospedagens') || '[]');
let activity: ActivityItem[]  = JSON.parse(localStorage.getItem('atlantis_activity')    || '[]');

let excluirIdx: number | null       = null;
let clienteFilter: ClienteFilterKey = 'todos';
let hospFilter: HospFilterKey       = 'todas';
let toastTimeout: ReturnType<typeof setTimeout>;

function save(): void {
  localStorage.setItem('atlantis_clientes',    JSON.stringify(clientes));
  localStorage.setItem('atlantis_hospedagens', JSON.stringify(hospedagens));
  localStorage.setItem('atlantis_activity',    JSON.stringify(activity));
}

function addActivity(msg: string): void {
  activity.unshift({ msg, time: new Date().toLocaleString('pt-BR') });
  if (activity.length > 15) activity.pop();
  save();
  renderDashboard();
}

function showPage(page: PageKey): void {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page)!.classList.add('active');

  const titles: Record<PageKey, string> = {
    dashboard:   'Dashboard',
    clientes:    'Hóspedes',
    acomodacoes: 'Acomodações',
    hospedagens: 'Hospedagens',
    checkout:    'Check-out',
  };
  document.getElementById('topbar-title')!.textContent = titles[page] || page;

  const navOrder: PageKey[] = ['dashboard', 'clientes', 'acomodacoes', 'hospedagens', 'checkout'];
  const idx = navOrder.indexOf(page);
  if (idx !== -1) (document.querySelectorAll('.nav-item')[idx] as HTMLElement)?.classList.add('active');

  const renderers: Record<PageKey, () => void> = {
    dashboard:   renderDashboard,
    clientes:    renderClientes,
    acomodacoes: renderAcomodacoes,
    hospedagens: renderHospedagens,
    checkout:    renderCheckout,
  };
  renderers[page]?.();
}

function renderDashboard(): void {
  document.getElementById('stat-clientes')!.textContent = String(clientes.length);
  document.getElementById('stat-ativas')!.textContent   = String(hospedagens.filter(h => h.ativo).length);
  document.getElementById('stat-checkout')!.textContent = String(hospedagens.filter(h => !h.ativo).length);

  const dashH = document.getElementById('dash-hospedagens')!;
  const recentes = hospedagens.slice(-5).reverse();
  dashH.innerHTML = recentes.length
    ? recentes.map(h => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 20px;border-bottom:1px solid var(--border-light)">
          <div>
            <div style="font-size:13.5px;font-weight:500">${h.clienteNome}</div>
            <div style="font-size:12px;color:var(--text-muted)">${h.acomodacaoNome} · ${h.entrada}</div>
          </div>
          ${h.ativo
            ? '<span class="badge badge-success">Ativa</span>'
            : '<span class="badge badge-navy">Encerrada</span>'}
        </div>`).join('')
    : '<div class="empty-state"><div class="empty-state-icon">📋</div><p>Nenhuma hospedagem registrada</p></div>';

  const dashAct = document.getElementById('dash-activity')!;
  dashAct.innerHTML = activity.length
    ? activity.slice(0, 6).map(a => `
        <div class="activity-item">
          <div class="activity-dot"></div>
          <div>
            <div class="activity-text">${a.msg}</div>
            <div class="activity-time">${a.time}</div>
          </div>
        </div>`).join('')
    : '<div class="empty-state"><div class="empty-state-icon">🕐</div><p>Nenhuma atividade registrada</p></div>';
}

function filterCliente(f: ClienteFilterKey, el: HTMLElement): void {
  clienteFilter = f;
  document.querySelectorAll('#page-clientes .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderClientes();
}

function renderClientes(): void {
  const q = ((document.getElementById('search-clientes') as HTMLInputElement)?.value || '').toLowerCase();
  const list = clientes.filter(c => {
    const matchQ = !q || c.nome.toLowerCase().includes(q) || c.nomeSocial.toLowerCase().includes(q);
    const matchF = clienteFilter === 'todos' || c.tipo === clienteFilter;
    return matchQ && matchF;
  });

  const tbody = document.getElementById('tbody-clientes')!;
  tbody.innerHTML = list.length
    ? list.map(c => {
        const realIdx = clientes.indexOf(c);
        return `<tr>
          <td><strong>${c.nome}</strong></td>
          <td>${c.nomeSocial || '—'}</td>
          <td>${c.nascimento || '—'}</td>
          <td>${c.cadastro}</td>
          <td><span class="badge ${c.tipo === 'titular' ? 'badge-gold' : 'badge-navy'}">
            ${c.tipo === 'titular' ? 'Titular' : 'Dependente'}
          </span></td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-sm" onclick="openEditarCliente(${realIdx})">✏ Editar</button>
              <button class="btn btn-danger btn-sm"  onclick="openExcluir(${realIdx})">🗑 Excluir</button>
            </div>
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👤</div><p>Nenhum hóspede encontrado</p></div></td></tr>';
}

function openModalCliente(): void {
  (['c-nome','c-nomesocial','c-cpf','c-rg','c-telefone','c-email','c-endereco'] as const)
    .forEach(id => (document.getElementById(id) as HTMLInputElement).value = '');
  (document.getElementById('c-nascimento') as HTMLInputElement).value = '';
  (document.getElementById('c-tipo') as HTMLSelectElement).value = 'titular';
  openModal('modal-cliente');
}

function salvarCliente(): void {
  const nome = (document.getElementById('c-nome') as HTMLInputElement).value.trim();
  if (!nome) { showToast('Informe o nome do hóspede.', '⚠'); return; }

  const c: Cliente = {
    nome,
    nomeSocial: (document.getElementById('c-nomesocial') as HTMLInputElement).value.trim(),
    nascimento: (document.getElementById('c-nascimento') as HTMLInputElement).value,
    tipo:       (document.getElementById('c-tipo') as HTMLSelectElement).value as 'titular' | 'dependente',
    cpf:        (document.getElementById('c-cpf') as HTMLInputElement).value.trim(),
    rg:         (document.getElementById('c-rg') as HTMLInputElement).value.trim(),
    telefone:   (document.getElementById('c-telefone') as HTMLInputElement).value.trim(),
    email:      (document.getElementById('c-email') as HTMLInputElement).value.trim(),
    endereco:   (document.getElementById('c-endereco') as HTMLInputElement).value.trim(),
    cadastro:   new Date().toLocaleDateString('pt-BR'),
  };

  clientes.push(c);
  save();
  renderClientes();
  renderDashboard();
  closeModal('modal-cliente');
  showToast(`Hóspede ${nome} cadastrado com sucesso!`);
  addActivity(`Hóspede "${nome}" cadastrado.`);
}

function openEditarCliente(idx: number): void {
  const c = clientes[idx];
  (document.getElementById('edit-idx')        as HTMLInputElement).value  = String(idx);
  (document.getElementById('edit-nome')       as HTMLInputElement).value  = c.nome;
  (document.getElementById('edit-nomesocial') as HTMLInputElement).value  = c.nomeSocial || '';
  (document.getElementById('edit-nascimento') as HTMLInputElement).value  = c.nascimento || '';
  (document.getElementById('edit-tipo')       as HTMLSelectElement).value = c.tipo || 'titular';
  (document.getElementById('edit-cpf')        as HTMLInputElement).value  = c.cpf || '';
  (document.getElementById('edit-telefone')   as HTMLInputElement).value  = c.telefone || '';
  (document.getElementById('edit-endereco')   as HTMLInputElement).value  = c.endereco || '';
  openModal('modal-editar-cliente');
}

function atualizarCliente(): void {
  const idx = parseInt((document.getElementById('edit-idx') as HTMLInputElement).value);
  clientes[idx].nome       = (document.getElementById('edit-nome')       as HTMLInputElement).value.trim();
  clientes[idx].nomeSocial = (document.getElementById('edit-nomesocial') as HTMLInputElement).value.trim();
  clientes[idx].nascimento = (document.getElementById('edit-nascimento') as HTMLInputElement).value;
  clientes[idx].tipo       = (document.getElementById('edit-tipo')       as HTMLSelectElement).value as 'titular' | 'dependente';
  clientes[idx].cpf        = (document.getElementById('edit-cpf')        as HTMLInputElement).value.trim();
  clientes[idx].telefone   = (document.getElementById('edit-telefone')   as HTMLInputElement).value.trim();
  clientes[idx].endereco   = (document.getElementById('edit-endereco')   as HTMLInputElement).value.trim();
  save();
  renderClientes();
  renderDashboard();
  closeModal('modal-editar-cliente');
  showToast('Dados do hóspede atualizados!');
  addActivity(`Hóspede "${clientes[idx].nome}" editado.`);
}

function openExcluir(idx: number): void {
  excluirIdx = idx;
  document.getElementById('excluir-nome')!.textContent = clientes[idx].nome;
  openModal('modal-excluir');
}

function confirmarExclusao(): void {
  const nome = clientes[excluirIdx!].nome;
  clientes.splice(excluirIdx!, 1);
  save();
  renderClientes();
  renderDashboard();
  closeModal('modal-excluir');
  showToast(`Hóspede ${nome} excluído.`, '🗑');
  addActivity(`Hóspede "${nome}" excluído.`);
}

function renderAcomodacoes(): void {
  const emojiMap: Record<string, string> = { Solteiro: '🛏', Casal: '🛏', Família: '👨‍👩‍👧', Super: '🏨' };
  const colorMap: Record<string, string> = { Solteiro: '#142850', Casal: '#1E3A6E', Família: '#0B3D6E', Super: '#07244A' };

  document.getElementById('rooms-grid')!.innerHTML = acomodacoes.map(a => `
    <div class="room-card">
      <div class="room-img" style="background:${colorMap[a.tipo]}">
        <span style="font-size:48px">${emojiMap[a.tipo] || '🏨'}</span>
        <span class="room-type-badge">${a.tipo}</span>
      </div>
      <div class="room-body">
        <div class="room-name">${a.nome}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">${a.desc}</div>
        <div class="room-features">
          ${a.camaSolteiro ? `<span class="feat-tag">🛏 ${a.camaSolteiro} solteiro</span>` : ''}
          ${a.camaCasal    ? `<span class="feat-tag">🛏 ${a.camaCasal} casal</span>`       : ''}
          ${a.suite        ? `<span class="feat-tag">🚿 ${a.suite} suíte</span>`           : ''}
          ${a.clima        ? `<span class="feat-tag">❄ Climatizado</span>`                 : ''}
          ${a.garagem      ? `<span class="feat-tag">🚗 ${a.garagem} vaga(s)</span>`       : ''}
        </div>
        <div class="room-footer">
          <span class="badge badge-success">Disponível</span>
          <span style="font-size:11px;color:var(--text-muted)">ID #${a.id}</span>
        </div>
      </div>
    </div>`).join('');
}

function filterHosp(f: HospFilterKey, el: HTMLElement): void {
  hospFilter = f;
  document.querySelectorAll('#page-hospedagens .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderHospedagens();
}

function renderHospedagens(): void {
  let list: Hospedagem[] = hospedagens;
  if (hospFilter === 'ativas')     list = list.filter(h =>  h.ativo);
  if (hospFilter === 'encerradas') list = list.filter(h => !h.ativo);

  const tbody = document.getElementById('tbody-hospedagens')!;
  tbody.innerHTML = list.length
    ? list.map(h => {
        const realIdx = hospedagens.indexOf(h);
        return `<tr>
          <td><strong>${h.clienteNome}</strong></td>
          <td>${h.acomodacaoNome}</td>
          <td>${h.entrada}</td>
          <td>${h.saida || '—'}</td>
          <td>${h.ativo
            ? '<span class="badge badge-success">Ativa</span>'
            : '<span class="badge badge-navy">Encerrada</span>'}</td>
          <td>${h.ativo
            ? `<button class="btn btn-outline btn-sm" onclick="openCheckout(${realIdx})">Check-out</button>`
            : '<span style="color:var(--text-muted);font-size:12px">Encerrada</span>'}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">📋</div><p>Nenhuma hospedagem encontrada</p></div></td></tr>';
}

function openModalHospedagem(): void {
  const titulares = clientes.filter(c => c.tipo === 'titular');
  if (!titulares.length) { showToast('Cadastre ao menos um hóspede titular.', '⚠'); return; }

  (document.getElementById('h-cliente') as HTMLSelectElement).innerHTML =
    titulares.map(c => `<option value="${clientes.indexOf(c)}">${c.nome}</option>`).join('');
  (document.getElementById('h-acomodacao') as HTMLSelectElement).innerHTML =
    acomodacoes.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
  (document.getElementById('h-entrada')    as HTMLInputElement).value = new Date().toISOString().split('T')[0];
  (document.getElementById('h-saida-prev') as HTMLInputElement).value = '';
  openModal('modal-hospedagem');
}

function registrarHospedagem(): void {
  const cidx    = parseInt((document.getElementById('h-cliente')    as HTMLSelectElement).value);
  const aid     = parseInt((document.getElementById('h-acomodacao') as HTMLSelectElement).value);
  const entrada = (document.getElementById('h-entrada') as HTMLInputElement).value;
  if (!entrada) { showToast('Informe a data de entrada.', '⚠'); return; }

  const cliente = clientes[cidx];
  const acom    = acomodacoes.find(a => a.id === aid)!;

  const h: Hospedagem = {
    clienteNome:    cliente.nome,
    clienteIdx:     cidx,
    acomodacaoNome: acom.nome,
    acomodacaoId:   aid,
    entrada:        new Date(entrada + 'T12:00:00').toLocaleDateString('pt-BR'),
    entradaISO:     entrada,
    saidaPrev:      (document.getElementById('h-saida-prev') as HTMLInputElement).value,
    saida:          null,
    ativo:          true,
  };

  hospedagens.push(h);
  save();
  renderHospedagens();
  renderDashboard();
  closeModal('modal-hospedagem');
  showToast(`Hospedagem de ${cliente.nome} registrada!`);
  addActivity(`Hospedagem registrada: "${cliente.nome}" → ${acom.nome}.`);
}

function renderCheckout(): void {
  const ativas = hospedagens.filter(h => h.ativo);
  const tbody  = document.getElementById('tbody-checkout')!;

  tbody.innerHTML = ativas.length
    ? ativas.map(h => {
        const realIdx = hospedagens.indexOf(h);
        const dias = Math.max(1, Math.ceil(
          (new Date().getTime() - new Date(h.entradaISO).getTime()) / (1000 * 60 * 60 * 24)
        ));
        return `<tr>
          <td><strong>${h.clienteNome}</strong></td>
          <td>${h.acomodacaoNome}</td>
          <td>${h.entrada}</td>
          <td>${dias} dia(s)</td>
          <td><button class="btn btn-gold btn-sm" onclick="openCheckout(${realIdx})">Realizar check-out</button></td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">✓</div><p>Nenhuma hospedagem ativa</p></div></td></tr>';
}

function openCheckout(idx: number): void {
  const h = hospedagens[idx];
  document.getElementById('co-nome')!.textContent = h.clienteNome;
  document.getElementById('co-acom')!.textContent = h.acomodacaoNome;
  (document.getElementById('co-idx') as HTMLInputElement).value = String(idx);
  openModal('modal-checkout');
}

function confirmarCheckout(): void {
  const idx = parseInt((document.getElementById('co-idx') as HTMLInputElement).value);
  hospedagens[idx].ativo = false;
  hospedagens[idx].saida = new Date().toLocaleDateString('pt-BR');
  save();
  renderHospedagens();
  renderCheckout();
  renderDashboard();
  closeModal('modal-checkout');
  const nome = hospedagens[idx].clienteNome;
  showToast(`Check-out de ${nome} realizado com sucesso!`);
  addActivity(`Check-out realizado: "${nome}".`);
}

function openModal(id: string): void  { document.getElementById(id)!.classList.add('open'); }
function closeModal(id: string): void { document.getElementById(id)!.classList.remove('open'); }

document.querySelectorAll('.modal-backdrop').forEach(b => {
  b.addEventListener('click', (e: Event) => {
    if (e.target === b) (b as HTMLElement).classList.remove('open');
  });
});

function showToast(msg: string, icon: string = '✓'): void {
  const t = document.getElementById('toast')!;
  (document.getElementById('toast-msg')  as HTMLElement).textContent = msg;
  (document.getElementById('toast-icon') as HTMLElement).textContent = icon;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3200);
}

// Expose functions called via onclick attributes in HTML
declare global {
  interface Window {
    showPage: typeof showPage;
    openModalCliente: typeof openModalCliente;
    salvarCliente: typeof salvarCliente;
    openEditarCliente: typeof openEditarCliente;
    atualizarCliente: typeof atualizarCliente;
    openExcluir: typeof openExcluir;
    confirmarExclusao: typeof confirmarExclusao;
    openModalHospedagem: typeof openModalHospedagem;
    registrarHospedagem: typeof registrarHospedagem;
    openCheckout: typeof openCheckout;
    confirmarCheckout: typeof confirmarCheckout;
    filterCliente: typeof filterCliente;
    filterHosp: typeof filterHosp;
    closeModal: typeof closeModal;
    showToast: typeof showToast;
  }
}

window.showPage            = showPage;
window.openModalCliente    = openModalCliente;
window.salvarCliente       = salvarCliente;
window.openEditarCliente   = openEditarCliente;
window.atualizarCliente    = atualizarCliente;
window.openExcluir         = openExcluir;
window.confirmarExclusao   = confirmarExclusao;
window.openModalHospedagem = openModalHospedagem;
window.registrarHospedagem = registrarHospedagem;
window.openCheckout        = openCheckout;
window.confirmarCheckout   = confirmarCheckout;
window.filterCliente       = filterCliente;
window.filterHosp          = filterHosp;
window.closeModal          = closeModal;
window.showToast           = showToast;

renderDashboard();
renderAcomodacoes();
