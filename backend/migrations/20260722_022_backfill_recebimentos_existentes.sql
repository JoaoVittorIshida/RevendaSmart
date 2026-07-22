UPDATE vendas SET data_recebimento = data_venda WHERE recebido = 1 AND data_recebimento IS NULL;
