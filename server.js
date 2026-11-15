require('dotenv').config();

const express = require('express');

const {
  inserirCurso,
  listarCursos,
  excluirCurso,
  inserirAluno,
  listarAlunos,
  listarAlunosDoCurso,
  buscarPorRa,
  atualizarAluno,
  excluirPorRa
} = require('./supabase');

const ERRO_CHAVE_ESTRANGEIRA = '23503';

const app = express();

app.use(express.json());
app.use(express.static('public'));

function lerPagina(query) {
  if (query.limite === undefined && query.inicio === undefined) {
    return null;
  }

  const limite = Number(query.limite);
  const inicio =
    query.inicio === undefined ? 0 : Number(query.inicio);

  if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
    return { erro: 'Informe limite entre 1 e 100' };
  }

  if (!Number.isInteger(inicio) || inicio < 0) {
    return { erro: 'inicio inválido' };
  }

  const busca = String(query.busca || '').trim();
  const ordem = String(query.ordem || 'nome').toLowerCase();
  const direcao = String(query.direcao || 'asc').toLowerCase();

  if (!['nome', 'ra', 'curso'].includes(ordem)) {
    return { erro: 'ordem inválida. Use nome, ra ou curso.' };
  }

  if (!['asc', 'desc'].includes(direcao)) {
    return { erro: 'direcao inválida. Use asc ou desc.' };
  }

  return { inicio, limite, busca, ordem, direcao };
}

app.get('/alunos', async (req, res) => {
  try {
    const pagina = lerPagina(req.query);

    if (pagina && pagina.erro) {
      return res.status(400).json({ erro: pagina.erro });
    }

    const dados = await listarAlunos(pagina || {});

    res.json(
      pagina
        ? { ...dados, inicio: pagina.inicio, limite: pagina.limite }
        : dados
    );
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get('/alunos/:ra', async (req, res) => {
  try {
    const aluno = await buscarPorRa(req.params.ra);

    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado' });
    }

    res.json(aluno);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post('/alunos', async (req, res) => {
  try {
    const { nome, ra, curso_id } = req.body;

    if (!String(nome || '').trim() || !String(ra || '').trim() || !curso_id) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: nome, ra e curso_id'
      });
    }

    const aluno = await inserirAluno(
      String(nome).trim(),
      String(ra).trim(),
      curso_id
    );

    res.status(201).json(aluno);
  } catch (e) {
    if (e.code === ERRO_CHAVE_ESTRANGEIRA) {
      return res.status(400).json({
        erro: 'O curso informado não existe'
      });
    }

    res.status(400).json({ erro: e.message });
  }
});

app.put('/alunos/:ra', async (req, res) => {
  try {
    const { nome, curso_id } = req.body;

    if (!nome && !curso_id) {
      return res.status(400).json({
        erro: 'Informe nome e/ou curso_id para atualizar'
      });
    }

    const data = await atualizarAluno(
      req.params.ra,
      nome,
      curso_id
    );

    if (!data || data.length === 0) {
      return res.status(404).json({ erro: 'Aluno não encontrado' });
    }

    res.json(data[0]);
  } catch (e) {
    if (e.code === ERRO_CHAVE_ESTRANGEIRA) {
      return res.status(400).json({
        erro: 'O curso informado não existe'
      });
    }

    res.status(400).json({ erro: e.message });
  }
});

app.delete('/alunos/:ra', async (req, res) => {
  try {
    const data = await excluirPorRa(req.params.ra);

    if (!data || data.length === 0) {
      return res.status(404).json({ erro: 'Aluno não encontrado' });
    }

    res.json({ mensagem: 'Aluno excluído com sucesso' });
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

app.get('/cursos', async (req, res) => {
  try {
    res.json(await listarCursos());
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post('/cursos', async (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({
        erro: 'Campo obrigatório: nome'
      });
    }

    res.status(201).json(await inserirCurso(nome));
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

app.delete('/cursos/:id', async (req, res) => {
  try {
    res.json(await excluirCurso(req.params.id));
  } catch (e) {
    if (e.code === ERRO_CHAVE_ESTRANGEIRA) {
      return res.status(409).json({
        erro: 'Não é possível excluir um curso que possui alunos.'
      });
    }

    res.status(400).json({ erro: e.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
