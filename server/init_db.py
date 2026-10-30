"""Cria as tabelas sem excluir as existentes: python init_db.py."""
from pathlib import Path
from db import connect


def main():
    connection = connect()
    try:
        with connection.cursor() as cursor:
            for statement in Path(__file__).with_name('schema.sql').read_text(encoding='utf-8').split(';'):
                if statement.strip():
                    cursor.execute(statement)
        print('Tabelas criadas.')
    finally:
        connection.close()


if __name__ == '__main__':
    main()
