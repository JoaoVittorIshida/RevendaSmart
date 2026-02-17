import React from 'react';
import { useData } from '../../contexts/DataContext';
import CrudBase from '../../components/CrudBase';

const CanaisVenda = () => {
    const { canaisVenda, adicionarCanalVenda, removerCanalVenda } = useData();

    return (
        <CrudBase
            title="Gerenciar Canais de Venda"
            items={canaisVenda}
            onAdd={adicionarCanalVenda}
            onRemove={removerCanalVenda}
        />
    );
};

export default CanaisVenda;
