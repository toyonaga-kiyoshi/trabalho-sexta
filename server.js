
require('dotenv').config();

const express = require('express');
const path = require('path');

const {
    inserirAluno,
    listarAlunos,
    buscarPorRa,
    buscarPorNome,
    atualizarAluno,
    excluirPorRa
} = require('./supabase');

// Cria o servidor primeiro
const app = express();

// Configurações do servidor
app.use(express.json());

// Permite acessar os arquivos do frontend
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});


// ==========================
// GET - LISTAR TODOS
// ==========================

app.get('/alunos', async (req, res) => {
    try {
        const dados = await listarAlunos();
        res.json(dados);
    } catch (e) {
        res.status(500).json({
            erro: e.message
        });
    }
});


// ==========================
// GET - BUSCAR POR RA
// ==========================

app.get('/alunos/:ra', async (req, res) => {
    try {
        const aluno = await buscarPorRa(req.params.ra);
        res.json(aluno);
    } catch (e) {
        res.status(500).json({
            erro: e.message
        });
    }
});


// ==========================
// POST - CADASTRAR
// ==========================

app.post('/alunos', async (req, res) => {
    try {
        const { nome, ra, curso } = req.body;

        if (!nome || !ra) {
            return res.status(400).json({
                erro: 'Campos obrigatórios: nome e ra'
            });
        }

        const aluno = await inserirAluno(nome, ra, curso);

        res.status(201).json(aluno);
    } catch (e) {
        res.status(500).json({
            erro: e.message
        });
    }
});


// ==========================
// PUT - ATUALIZAR
// ==========================

app.put('/alunos/:ra', async (req, res) => {
    try {
        const { nome, curso } = req.body;

        if (!nome && !curso) {
            return res.status(400).json({
                erro: 'Informe nome e/ou curso para atualizar'
            });
        }

        const data = await atualizarAluno(
            req.params.ra,
            nome,
            curso
        );

        res.json(data);
    } catch (e) {
        res.status(400).json({
            erro: e.message
        });
    }
});


// ==========================
// DELETE - EXCLUIR
// ==========================

app.delete('/alunos/:ra', async (req, res) => {
    try {
        const data = await excluirPorRa(req.params.ra);
        res.json(data);
    } catch (e) {
        res.status(400).json({
            erro: e.message
        });
    }
});


// ==========================
// SERVIDOR
// ==========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
