UPDATE vendas SET dados_incompletos = 1 WHERE status = 'concluida' AND (valor_bruto IS NULL OR valor_liquido IS NULL OR data_venda IS NULL);
