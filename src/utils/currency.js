// Formata centavos para exibição no input: 123456 → "1.234,56"
export const formatarMoeda = (centavos) => {
    if (!centavos) return '';
    return (centavos / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Extrai centavos de qualquer entrada do usuário: "1.234,56" → 123456
export const parsearMoeda = (valor) => {
    const digits = String(valor).replace(/\D/g, '');
    return parseInt(digits || '0', 10);
};

// Centavos → float para enviar à API: 123456 → 1234.56
export const centavosParaReais = (centavos) => centavos / 100;
