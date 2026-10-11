require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// INSERIR
async function inserirAluno(nome, ra, curso) {
    const { data, error } = await supabase
        .from('alunos')
        .insert([
            {
                nome,
                ra,
                curso
            }
        ])
        .select();

    if (error) throw error;

    return data;
}

// LISTAR
async function listarAlunos() {
    const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('nome', { ascending: true });

    if (error) throw error;

    return data;
}

// BUSCAR POR RA
async function buscarPorRa(ra) {
    const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('ra', ra)
        .single();

    if (error) throw error;

    return data;
}

// BUSCAR POR NOME
async function buscarPorNome(parteNome) {
    const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .ilike('nome', `%${parteNome}%`)
        .order('nome', { ascending: true });

    if (error) throw error;

    return data;
}

// ATUALIZAR
async function atualizarAluno(ra, nome, curso) {
    const campos = {};

    if (nome) campos.nome = nome;
    if (curso) campos.curso = curso;

    if (Object.keys(campos).length === 0) {
        throw new Error('Informe nome e/ou curso para atualizar');
    }

    const { data, error } = await supabase
        .from('alunos')
        .update(campos)
        .eq('ra', ra)
        .select();

    if (error) throw error;

    return data;
}

// EXCLUIR
async function excluirPorRa(ra) {
    const { data, error } = await supabase
        .from('alunos')
        .delete()
        .eq('ra', ra)
        .select();

    if (error) throw error;

    return data;
}

module.exports = {
    supabase,
    inserirAluno,
    listarAlunos,
    buscarPorRa,
    buscarPorNome,
    atualizarAluno,
    excluirPorRa
};