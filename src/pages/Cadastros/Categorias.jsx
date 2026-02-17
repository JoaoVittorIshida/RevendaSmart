import React from 'react';
import { useData } from '../../contexts/DataContext';
import CrudBase from '../../components/CrudBase';

const Categorias = () => {
    const { categorias, adicionarCategoria, removerCategoria } = useData();

    return (
        <CrudBase
            title="Gerenciar Categorias"
            items={categorias}
            onAdd={adicionarCategoria}
            onRemove={removerCategoria}
        />
    );
};

export default Categorias;
