
const API = 'http://localhost:3000';

let editandoRA = null;

// Elementos do HTML
const tabela = document.getElementById('tabela-alunos');
const modal = document.getElementById('modal');
const formulario = document.getElementById('form-aluno');
const mensagem = document.getElementById('msg');

// Mostrar mensagem na tela
function mostrarMensagem(texto) {
    mensagem.textContent = texto;
    mensagem.hidden = false;

    setTimeout(() => {
        mensagem.hidden = true;
    }, 4000);
}

// Carregar alunos do banco
async function carregarAlunos() {
    try {
        const resposta = await fetch(`${API}/alunos`);
        const alunos = await resposta.json();

        if (!resposta.ok) {
            throw new Error(alunos.erro || 'Erro ao carregar alunos');
        }

        tabela.innerHTML = '';

        if (!Array.isArray(alunos) || alunos.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="4" class="vazio">
                        Nenhum aluno cadastrado.
                    </td>
                </tr>
            `;
            return;
        }

        alunos.forEach(aluno => {
            const linha = document.createElement('tr');

            // Evita inserir os dados como HTML
            [aluno.nome, aluno.ra, aluno.curso || ''].forEach(valor => {
                const celula = document.createElement('td');
                celula.textContent = valor;
                linha.appendChild(celula);
            });

            const acoes = document.createElement('td');

            const editar = document.createElement('button');
            editar.textContent = 'Editar';
            editar.type = 'button';
            editar.addEventListener('click', () => abrirEdicao(aluno));

            const excluir = document.createElement('button');
            excluir.textContent = 'Excluir';
            excluir.type = 'button';
            excluir.addEventListener('click', () => excluirAluno(aluno.ra));

            acoes.append(editar, excluir);
            linha.appendChild(acoes);
            tabela.appendChild(linha);
        });

    } catch (erro) {
        console.error(erro);
        mostrarMensagem('Erro ao carregar alunos: ' + erro.message);
    }
}

// Abrir formulário para novo aluno
document.getElementById('btn-novo').addEventListener('click', () => {
    editandoRA = null;
    formulario.reset();

    document.getElementById('ra').disabled = false;
    document.getElementById('modal-titulo').textContent = 'Novo aluno';

    modal.hidden = false;
});

// Abrir formulário para editar
function abrirEdicao(aluno) {
    editandoRA = aluno.ra;

    document.getElementById('nome').value = aluno.nome;
    document.getElementById('ra').value = aluno.ra;
    document.getElementById('curso').value = aluno.curso || '';

    document.getElementById('ra').disabled = true;
    document.getElementById('modal-titulo').textContent = 'Editar aluno';

    modal.hidden = false;
}

// Fechar formulário
function fecharModal() {
    modal.hidden = true;
    formulario.reset();
    editandoRA = null;
    document.getElementById('ra').disabled = false;
}

document.getElementById('btn-cancelar')
    .addEventListener('click', fecharModal);

document.getElementById('modal-fundo')
    .addEventListener('click', fecharModal);

// Cadastrar ou atualizar aluno
formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const ra = document.getElementById('ra').value.trim();
    const curso = document.getElementById('curso').value.trim();

    if (!nome || (!ra && editandoRA === null)) {
        mostrarMensagem('Preencha o nome e o RA.');
        return;
    }

    const editando = editandoRA !== null;

    const url = editando
        ? `${API}/alunos/${encodeURIComponent(editandoRA)}`
        : `${API}/alunos`;

    const metodo = editando ? 'PUT' : 'POST';

    const dados = editando
        ? { nome, curso }
        : { nome, ra, curso };

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || 'Não foi possível salvar');
        }

        fecharModal();
        mostrarMensagem(editando
            ? 'Aluno atualizado com sucesso!'
            : 'Aluno cadastrado com sucesso!');

        await carregarAlunos();

    } catch (erro) {
        console.error(erro);
        mostrarMensagem('Erro ao salvar: ' + erro.message);
    }
});

// Excluir aluno
async function excluirAluno(ra) {
    if (!confirm(`Deseja excluir o aluno com RA ${ra}?`)) {
        return;
    }

    try {
        const resposta = await fetch(
            `${API}/alunos/${encodeURIComponent(ra)}`,
            { method: 'DELETE' }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || 'Não foi possível excluir');
        }

        mostrarMensagem('Aluno excluído com sucesso!');
        await carregarAlunos();

    } catch (erro) {
        console.error(erro);
        mostrarMensagem('Erro ao excluir: ' + erro.message);
    }
}

// Botão para atualizar a tabela
document.getElementById('btn-atualizar')
    .addEventListener('click', carregarAlunos);

// Carregar a tabela quando abrir a página
carregarAlunos();
