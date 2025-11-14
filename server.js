// Dependências
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

// Configuração do Express
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // Habilita o parsing de JSON no corpo da requisição
app.use(cors()); // Habilita o CORS

// --- Configuração do Banco de Dados MySQL ---
const dbConfig = {
    host: 'localhost', // Mude se o seu servidor MySQL estiver em outro lugar
    user: 'root',      // Seu usuário do MySQL
    password: 'sua_senha', // Sua senha do MySQL
    database: 'biblioteca_db'
};

// Cria um pool de conexões
let pool;
try {
    pool = mysql.createPool(dbConfig);
    console.log('Pool de conexões MySQL criado com sucesso.');
} catch (error) {
    console.error('Falha ao criar o pool de conexões MySQL:', error);
    process.exit(1); // Encerra a aplicação se não puder conectar ao banco
}


// --- Funções Auxiliares de Validação ---

/**
 * Valida os campos obrigatórios para a criação de um livro.
 * @param {object} data - Dados do livro
 * @param {boolean} isUpdate - Se é uma validação para atualização (PUT)
 * @returns {Array<string>} Lista de mensagens de erro.
 */
function validarDadosLivro(data, isUpdate = false) {
    const erros = [];

    // Campos obrigatórios para POST
    if (!isUpdate) {
        if (!data.titulo) {
            erros.push("O campo 'titulo' é obrigatório.");
        }
        if (!data.autor) {
            erros.push("O campo 'autor' é obrigatório.");
        }
        if (data.ano_publicacao === undefined || data.ano_publicacao === null) {
            erros.push("O campo 'ano_publicacao' é obrigatório.");
        }
    }

    // Validação de tipo para ambos
    if (data.ano_publicacao !== undefined && typeof data.ano_publicacao !== 'number') {
        erros.push("O campo 'ano_publicacao' deve ser um número inteiro.");
    }

    if (data.disponivel !== undefined && typeof data.disponivel !== 'boolean') {
        erros.push("O campo 'disponivel' deve ser um valor booleano (true/false).");
    }

    return erros;
}


// --- Endpoints da API (CRUD) ---

// 1. Criar um novo livro (POST /livros)
app.post('/livros', async (req, res) => {
    const data = req.body;

    const erros = validarDadosLivro(data);
    if (erros.length > 0) {
        return res.status(400).json({ erro: "Requisição inválida", detalhes: erros });
    }

    // Define valores padrão se não fornecidos
    const { 
        titulo, 
        autor, 
        ano_publicacao, 
        isbn = null, 
        disponivel = true 
    } = data;

    try {
        const query = `
            INSERT INTO livros (titulo, autor, ano_publicacao, isbn, disponivel)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [titulo, autor, ano_publicacao, isbn, disponivel]);
        
        const novoLivro = {
            id: result.insertId,
            titulo,
            autor,
            ano_publicacao,
            isbn,
            disponivel,
            mensagem: "Livro cadastrado com sucesso!"
        };

        return res.status(201).json(novoLivro);

    } catch (error) {
        console.error('Erro ao criar livro:', error);
        return res.status(500).json({ erro: "Erro interno do servidor ao criar livro." });
    }
});


// 2. Listar todos os livros (GET /livros)
app.get('/livros', async (req, res) => {
    const autorFiltro = req.query.autor;
    let query = "SELECT * FROM livros ORDER BY id DESC";
    let params = [];

    // Bônus: Filtro por autor
    if (autorFiltro) {
        query = "SELECT * FROM livros WHERE autor LIKE ? ORDER BY id DESC";
        params = [`%${autorFiltro}%`];
    }

    try {
        const [rows] = await pool.execute(query, params);
        
        // Formata a resposta
        const livros = rows.map(livro => ({
            ...livro,
            disponivel: !!livro.disponivel // Converte 0/1 do MySQL para boolean
        }));
        
        return res.status(200).json({
            total: livros.length,
            livros: livros
        });
        
    } catch (error) {
        console.error('Erro ao listar livros:', error);
        return res.status(500).json({ erro: "Erro interno do servidor ao listar livros." });
    }
});


// 3. Buscar um livro específico (GET /livros/:id)
app.get('/livros/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await pool.execute("SELECT * FROM livros WHERE id = ?", [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ erro: "Livro não encontrado" });
        }
        
        const livro = rows[0];
        // Converte 0/1 do MySQL para boolean
        livro.disponivel = !!livro.disponivel; 
        
        return res.status(200).json(livro);

    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        return res.status(500).json({ erro: "Erro interno do servidor ao buscar livro." });
    }
});


// 4. Atualizar um livro (PUT /livros/:id)
app.put('/livros/:id', async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ erro: "Nenhum dado de atualização fornecido." });
    }

    const erros = validarDadosLivro(data, true);
    if (erros.length > 0) {
        return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
    }

    try {
        // 1. Verifica se o livro existe
        const [livroRows] = await pool.execute("SELECT * FROM livros WHERE id = ?", [id]);
        if (livroRows.length === 0) {
            return res.status(404).json({ erro: "Livro não encontrado" });
        }
        
        // 2. Constrói a query de atualização dinamicamente
        const campos = [];
        const valores = [];
        
        // Mapeia campos do body para colunas do DB
        const camposPermitidos = ['titulo', 'autor', 'ano_publicacao', 'isbn', 'disponivel'];
        
        for (const key of camposPermitidos) {
            if (data[key] !== undefined) {
                campos.push(`${key} = ?`);
                valores.push(data[key]);
            }
        }
        
        if (campos.length === 0) {
            // Se não houver campos válidos, retorna o livro original (200 OK)
            const livroOriginal = livroRows[0];
            livroOriginal.disponivel = !!livroOriginal.disponivel;
            return res.status(200).json(livroOriginal);
        }

        valores.push(id); // Adiciona o ID ao final dos valores
        
        const query = `UPDATE livros SET ${campos.join(', ')} WHERE id = ?`;
        
        // 3. Executa a atualização
        await pool.execute(query, valores);

        // 4. Busca o livro atualizado para a resposta
        const [rowsAtualizado] = await pool.execute("SELECT * FROM livros WHERE id = ?", [id]);
        const livroAtualizado = rowsAtualizado[0];

        // Formata a resposta
        livroAtualizado.disponivel = !!livroAtualizado.disponivel;
        livroAtualizado.mensagem = "Livro atualizado com sucesso!";
        
        return res.status(200).json(livroAtualizado);

    } catch (error) {
        console.error('Erro ao atualizar livro:', error);
        return res.status(500).json({ erro: "Erro interno do servidor ao atualizar livro." });
    }
});


// 5. Deletar um livro (DELETE /livros/:id)
app.delete('/livros/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const [result] = await pool.execute("DELETE FROM livros WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Livro não encontrado" });
        }
        
        return res.status(200).json({ mensagem: "Livro removido com sucesso!" });

    } catch (error) {
        console.error('Erro ao deletar livro:', error);
        return res.status(500).json({ erro: "Erro interno do servidor ao deletar livro." });
    }
});


// --- Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 API de Biblioteca rodando em http://localhost:${PORT}`);
});