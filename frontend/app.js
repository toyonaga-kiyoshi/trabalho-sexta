
const tabela = document.getElementById('tabela-alunos');
const tabelaCursos = document.getElementById('tabela-cursos');
const msg = document.getElementById('msg');
const modal = document.getElementById('modal');
const modalTitulo = document.getElementById('modal-titulo');
const form = document.getElementById('form-aluno');
const inputNome = document.getElementById('nome');
const inputRa = document.getElementById('ra');
const selectCurso = document.getElementById('curso');
const filtroCurso = document.getElementById('filtro-curso');
const formCurso = document.getElementById('form-curso');
const inputNovoCurso = document.getElementById('novo-curso');
const alunosStatus = document.getElementById('alunos-status');
const sentinelaAlunos = document.getElementById('sentinela-alunos');

let modo = 'criar';
let raEditando = '';

const ALUNOS_POR_PAGINA = 5;

let alunosInicio = 0;
let alunosTotal = 0;
let alunosTemMais = false;
let alunosCarregando = false;
let alunosErro = false;
let alunosPedido = 0;

function mostrarMsg(texto, tipo = '') {
  msg.hidden = false;
  msg.textContent = texto;
  msg.className = 'msg' + (tipo ? ` ${tipo}` : '');
}

async function listarCursos() {
  try {
    const resposta = await fetch('/cursos');
    const cursos = await resposta.json();

    if (!resposta.ok) {
      mostrarMsg(cursos.erro || 'Erro ao listar cursos', 'erro');
      return;
    }

    montarTabelaCursos(cursos);
    preencherSelects(cursos);
  } catch (e) {
    mostrarMsg('Não foi possível conectar à API.', 'erro');
  }
}

function montarTabelaCursos(cursos) {
  if (!cursos.length) {
    tabelaCursos.innerHTML =
      '<tr><td colspan="3" class="vazio">Nenhum curso cadastrado ainda.</td></tr>';
    return;
  }

  tabelaCursos.innerHTML = '';

  for (const curso of cursos) {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    tdNome.textContent = curso.nome;

    const tdTotal = document.createElement('td');
    tdTotal.textContent = curso.total_alunos;

    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'acoes';

    const btnVer = document.createElement('button');
    btnVer.className = 'btn';
    btnVer.textContent = 'Ver alunos';
    btnVer.onclick = () => {
      filtroCurso.value = String(curso.id);
      listarAlunos(false);
    };

    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn btn-perigo';
    btnExcluir.textContent = 'Excluir';
    btnExcluir.onclick = () => excluirCurso(curso.id, curso.nome);

    tdAcoes.appendChild(btnVer);
    tdAcoes.appendChild(btnExcluir);

    tr.appendChild(tdNome);
    tr.appendChild(tdTotal);
    tr.appendChild(tdAcoes);

    tabelaCursos.appendChild(tr);
  }
}

function preencherSelects(cursos) {
  const filtroAtual = filtroCurso.value;
  const cursoAtual = selectCurso.value;

  filtroCurso.innerHTML = '<option value="">Todos os cursos</option>';
  selectCurso.innerHTML = '<option value="">Selecione um curso</option>';

  for (const curso of cursos) {
    filtroCurso.appendChild(new Option(curso.nome, curso.id));
    selectCurso.appendChild(new Option(curso.nome, curso.id));
  }

  filtroCurso.value = filtroAtual;
  selectCurso.value = cursoAtual;

  if (filtroCurso.selectedIndex === -1) filtroCurso.value = '';
  if (selectCurso.selectedIndex === -1) selectCurso.value = '';
}

async function adicionarCurso(evento) {
  evento.preventDefault();

  const nome = inputNovoCurso.value.trim();

  if (!nome) {
    mostrarMsg('Informe o nome do curso.', 'erro');
    return;
  }

  try {
    const resposta = await fetch('/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarMsg(dados.erro || 'Erro ao cadastrar curso', 'erro');
      return;
    }

    inputNovoCurso.value = '';
    mostrarMsg(`Curso "${dados.nome}" cadastrado!`, 'ok');
    await listarCursos();
  } catch (e) {
    mostrarMsg('Erro de conexão ao cadastrar curso.', 'erro');
  }
}

async function excluirCurso(id, nome) {
  if (!confirm(`Excluir o curso "${nome}"?`)) return;

  try {
    const resposta = await fetch('/cursos/' + id, {
      method: 'DELETE'
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarMsg(dados.erro || 'Erro ao excluir curso', 'erro');
      return;
    }

    mostrarMsg('Curso excluído.', 'ok');
    atualizarTudo();
  } catch (e) {
    mostrarMsg('Erro de conexão ao excluir curso.', 'erro');
  }
}

function abrirModalCriar() {
  if (selectCurso.options.length <= 1) {
    mostrarMsg('Cadastre um curso antes de incluir alunos.', 'erro');
    return;
  }

  modo = 'criar';
  raEditando = '';
  modalTitulo.textContent = 'Novo aluno';
  form.reset();
  selectCurso.value = filtroCurso.value;
  inputRa.disabled = false;
  modal.hidden = false;
  inputNome.focus();
}

function abrirModalEditar(aluno) {
  modo = 'editar';
  raEditando = aluno.ra;
  modalTitulo.textContent = 'Editar aluno';
  inputNome.value = aluno.nome || '';
  inputRa.value = aluno.ra || '';
  selectCurso.value = aluno.curso_id;
  inputRa.disabled = true;
  modal.hidden = false;
  inputNome.focus();
}

function fecharModal() {
  modal.hidden = true;
  form.reset();
  inputRa.disabled = false;
}

function linhaAluno(aluno) {
  const tr = document.createElement('tr');

  const tdNome = document.createElement('td');
  tdNome.textContent = aluno.nome;

  const tdRa = document.createElement('td');
  tdRa.textContent = aluno.ra;

  const tdCurso = document.createElement('td');
  tdCurso.textContent = aluno.curso ? aluno.curso.nome : '—';

  const tdAcoes = document.createElement('td');
  tdAcoes.className = 'acoes';

  const btnEditar = document.createElement('button');
  btnEditar.className = 'btn';
  btnEditar.textContent = 'Editar';
  btnEditar.onclick = () => abrirModalEditar(aluno);

  const btnExcluir = document.createElement('button');
  btnExcluir.className = 'btn btn-perigo';
  btnExcluir.textContent = 'Excluir';
  btnExcluir.onclick = () => excluirAluno(aluno.ra, aluno.nome);

  tdAcoes.appendChild(btnEditar);
  tdAcoes.appendChild(btnExcluir);

  tr.appendChild(tdNome);
  tr.appendChild(tdRa);
  tr.appendChild(tdCurso);
  tr.appendChild(tdAcoes);

  return tr;
}

async function listarAlunos(acrescentar = false) {
  if (acrescentar && (alunosCarregando || !alunosTemMais)) {
    return;
  }

  const pedido = acrescentar ? alunosPedido : ++alunosPedido;
  const inicio = acrescentar ? alunosInicio : 0;

  if (!acrescentar) {
    alunosInicio = 0;
    alunosTotal = 0;
    alunosTemMais = true;
    alunosErro = false;
    tabela.innerHTML = '';
  }

  alunosCarregando = true;

  if (inicio === 0) {
    alunosStatus.textContent = 'Carregando...';
  } else {
    alunosStatus.textContent =
      `Mostrando ${alunosInicio} de ${alunosTotal}. Carregando mais...`;
  }

  try {
    const cursoId = filtroCurso.value;
    const base = cursoId
      ? `/cursos/${cursoId}/alunos`
      : '/alunos';

    const resposta = await fetch(
      `${base}?inicio=${inicio}&limite=${ALUNOS_POR_PAGINA}`
    );

    const dados = await resposta.json();

    if (pedido !== alunosPedido) return;

    if (!resposta.ok) {
      alunosErro = true;
      alunosTemMais = false;
      alunosStatus.textContent =
        'A lista não carregou. Use Atualizar lista para tentar de novo.';
      mostrarMsg(dados.erro || 'Erro ao listar alunos', 'erro');
      return;
    }

    const alunos = dados.alunos || [];
    alunosTotal = dados.total || 0;

    if (!alunosTotal) {
      tabela.innerHTML =
        '<tr><td colspan="4" class="vazio">Nenhum aluno para mostrar.</td></tr>';
      alunosTemMais = false;
      alunosStatus.textContent = 'Nenhum aluno para mostrar.';
      return;
    }

    for (const aluno of alunos) {
      tabela.appendChild(linhaAluno(aluno));
    }

    alunosInicio = inicio + alunos.length;
    alunosTemMais = alunosInicio < alunosTotal;

    if (alunosTemMais) {
      alunosStatus.textContent =
        `Mostrando ${alunosInicio} de ${alunosTotal}. Role a tela para carregar mais.`;
    } else {
      alunosStatus.textContent =
        `Mostrando ${alunosInicio} de ${alunosTotal}. Fim da lista.`;
    }
  } catch (e) {
    if (pedido !== alunosPedido) return;

    alunosErro = true;
    alunosTemMais = false;
    alunosStatus.textContent =
      'A lista não carregou. Use Atualizar lista para tentar de novo.';
    mostrarMsg('Erro de conexão com a API.', 'erro');
  } finally {
    if (pedido === alunosPedido) {
      alunosCarregando = false;
      pedirMaisSeVisivel();
    }
  }
}

function pedirMaisSeVisivel() {
  if (!alunosTemMais || alunosCarregando) return;

  const topo = sentinelaAlunos.getBoundingClientRect().top;

  if (topo <= window.innerHeight + 160) {
    listarAlunos(true);
  }
}

function atualizarTudo() {
  listarCursos();
  listarAlunos(false);
}

// CADASTRAR E EDITAR ALUNO
async function salvarAluno(evento) {
  evento.preventDefault();

  const nome = inputNome.value.trim();
  const ra = inputRa.value.trim();
  const curso_id = selectCurso.value;

  if (!nome || !ra || !curso_id) {
    mostrarMsg('Preencha todos os campos.', 'erro');
    return;
  }

  const dadosAluno = {
    nome,
    curso_id: Number(curso_id)
  };

  let url = '/alunos';
  let metodo = 'POST';

  if (modo === 'editar') {
    url = '/alunos/' + encodeURIComponent(raEditando);
    metodo = 'PUT';
  } else {
    dadosAluno.ra = ra;
  }

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosAluno)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarMsg(dados.erro || 'Erro ao salvar aluno.', 'erro');
      return;
    }

    fecharModal();

    mostrarMsg(
      modo === 'editar'
        ? 'Aluno atualizado com sucesso!'
        : 'Aluno cadastrado com sucesso!',
      'ok'
    );

    await listarCursos();
    await listarAlunos(false);
  } catch (e) {
    mostrarMsg('Erro de conexão ao salvar aluno.', 'erro');
  }
}

// EXCLUIR ALUNO
async function excluirAluno(ra, nome) {
  if (!confirm(`Deseja realmente excluir o aluno "${nome}"?`)) {
    return;
  }

  try {
    const resposta = await fetch(
      '/alunos/' + encodeURIComponent(ra),
      {
        method: 'DELETE'
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarMsg(dados.erro || 'Erro ao excluir aluno.', 'erro');
      return;
    }

    mostrarMsg('Aluno excluído com sucesso!', 'ok');

    await listarCursos();
    await listarAlunos(false);
  } catch (e) {
    mostrarMsg('Erro de conexão ao excluir aluno.', 'erro');
  }
}

document
  .getElementById('btn-novo')
  .addEventListener('click', abrirModalCriar);

document
  .getElementById('btn-cancelar')
  .addEventListener('click', fecharModal);

document
  .getElementById('modal-fundo')
  .addEventListener('click', fecharModal);

form.addEventListener('submit', salvarAluno);
formCurso.addEventListener('submit', adicionarCurso);

filtroCurso.addEventListener('change', () => listarAlunos(false));

document
  .getElementById('btn-atualizar')
  .addEventListener('click', atualizarTudo);

window.addEventListener('scroll', pedirMaisSeVisivel);
window.addEventListener('resize', pedirMaisSeVisivel);

atualizarTudo();
