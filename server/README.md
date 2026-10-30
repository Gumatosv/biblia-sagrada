# API MariaDB

Requer Python 3.11+ e um servidor MariaDB. A API usa Flask, PyMySQL e Waitress. O React continua acessando `/api`, na porta 3001; as credenciais ficam somente no servidor. Cada requisição abre uma conexão quando necessário e a fecha ao terminar. As consultas são parametrizadas, conforme a [documentação do PyMySQL](https://pymysql.readthedocs.io/en/latest/user/examples.html). Node.js continua necessário para as ferramentas do frontend React.

## Preparação

No MariaDB, como administrador, crie um banco e um usuário exclusivo (substitua a senha):

```sql
CREATE DATABASE bibliavida CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bibliavida'@'127.0.0.1' IDENTIFIED BY 'troque-esta-senha';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, REFERENCES ON bibliavida.* TO 'bibliavida'@'127.0.0.1';
```

Na pasta `biblia/server`, execute no PowerShell:

```powershell
Copy-Item .env.example .env
# Edite .env com os dados reais do MariaDB.
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe init_db.py
.\.venv\Scripts\python.exe app.py
```

Em outro terminal, na pasta `biblia`, execute `npm.cmd start`. O proxy de desenvolvimento encaminha `/api` para `127.0.0.1:3001`. Reinicie o React se ele já estava aberto antes da mudança do proxy. Verifique `http://127.0.0.1:3001/api/health`: deve retornar `{"ok":true}`.

`init_db.py` cria as tabelas sem apagar dados existentes. O banco precisa existir antes. Não coloque variáveis `DB_*` em variáveis `REACT_APP_*`.

## Recursos

- Cadastro e login com e-mail normalizado; senhas com scrypt e salt individual.
- Sessões de sete dias em cookies HttpOnly; tokens armazenados como hash no banco.
- Logout revoga a sessão no servidor.
- Progresso por capítulo ou livro, sem o limite anterior de 1000 linhas.
- Uma meta por usuário; datas armazenadas como DATE e retornadas como texto.
- O usuário é identificado pela sessão; as rotas não aceitam `user_id` do navegador.
- Limite de tentativas de autenticação por IP, em memória. Em várias instâncias, substitua por um limitador compartilhado no proxy ou Redis.

## Migração dos dados do Supabase

Esta implementação começa com um banco novo. **Nenhuma conta ou leitura existente foi transferida automaticamente.** O `.env` anterior foi preservado, mas o React passou a usar a API MariaDB.

Antes de trocar o ambiente em uso:

1. Exporte e guarde um backup de `auth.users`, `capitulos_lidos` e `metas_leitura` do Supabase. Faça isso por uma conexão administrativa; não coloque uma chave service-role no React.
2. Prepare a importação em um banco de teste, preservando os UUIDs dos usuários e os vínculos `user_id`, os nomes dos livros, os capítulos e as datas. Insira os usuários antes das leituras e metas. Confirme o formato real da exportação antes de escrever o importador.
3. As senhas do Supabase não são senhas em texto e não podem ser simplesmente copiadas para `password_hash`: esta API usa scrypt. Defina uma estratégia de redefinição de senha ou compatibilidade com os hashes exportados antes da migração das contas. Ainda não há fluxo de redefinição de senha ou confirmação de e-mail nesta API.
4. Compare as contagens por usuário, capítulos, metas e último capítulo lido entre origem e destino; teste duas contas para confirmar isolamento.
5. Durante a transferência final, interrompa gravações na origem, importe o último estado e só então direcione o site para a API. Guarde o backup para recuperação.

## Publicação

Sirva o build do React e `/api` no mesmo domínio via proxy reverso para a API. Configure `APP_ORIGIN` com a origem exata do site, HTTPS e `COOKIE_SECURE=true`. O proxy deve preservar o cabeçalho `Origin`. A API escuta em loopback. Não publique a porta do MariaDB na internet. Configure backups, recuperação de senha e envio de e-mail antes de substituir autenticação em um ambiente com usuários reais.

## Verificação

```powershell
# biblia/server
.\.venv\Scripts\python.exe -m unittest discover -v
# biblia
npm.cmd test -- --watchAll=false --runInBand
npm.cmd run build
```

Os testes Python usam o cliente de testes do Flask e banco simulado. Cobrem cadastro/login/logout, cookies, isolamento por sessão, validações e hashes. O frontend mantém seus testes de chamadas e notificações de autenticação. É necessário um MariaDB configurado para validar a persistência de ponta a ponta.

## Entendendo os arquivos Python

| Arquivo | Responsabilidade |
|---|---|
| `app.py` | Define as rotas, verifica a sessão e valida os pedidos do React |
| `db.py` | Lê o `.env`, conecta ao MariaDB e executa SQL com parâmetros |
| `security.py` | Gera e compara hashes scrypt; valida datas |
| `init_db.py` | Executa o `schema.sql` para criar as tabelas |
| `test_api.py` | Verifica o comportamento HTTP usando um banco simulado |
| `requirements.txt` | Lista as bibliotecas Python que o projeto precisa |

O comando `python -m venv .venv` cria um ambiente isolado para essas bibliotecas. Usar o executável `.venv\Scripts\python.exe` dispensa ativar scripts no PowerShell. Na pasta `biblia`, os atalhos `npm.cmd run server` e `npm.cmd run db:init` usam esse ambiente Python no Windows. Em Linux/macOS, crie o ambiente e use `.venv/bin/python app.py` ou `.venv/bin/python init_db.py` na pasta `server`.

O schema MariaDB e o formato dos hashes scrypt foram mantidos. A troca de linguagem não importa os dados do Supabase. Se houver uma API Node.js antiga rodando na porta 3001, encerre-a antes de iniciar a versão Python.

A API é executada com Waitress, sem depurador exposto. Para entender as rotas, comece por `create_app()` em `app.py`. Um decorador como `@app.get('/api/progress')` associa um endereço HTTP à função logo abaixo. A função consulta o banco e `jsonify()` transforma o resultado em JSON para o React.
