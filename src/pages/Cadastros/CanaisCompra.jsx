import React from 'react';
import { useData } from '../../contexts/DataContext';
import CrudBase from '../../components/CrudBase';

const CanaisCompra = () => {
    const { canaisCompra, adicionarCanalCompra, removerCanalCompra } = useData();

    return (
        <CrudBase
            title="Gerenciar Canais de Compra"
            items={canaisCompra}
            onAdd={adicionarCanalCompra}
            onRemove={removerCanalCompra}
        />
    );
};

export default CanaisCompra;
