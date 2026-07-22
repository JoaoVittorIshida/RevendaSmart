const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const validateImageFile = (file) => {
    if (!file || !SUPPORTED_IMAGE_TYPES.has(file.type)) return 'Use uma imagem PNG, JPG ou WEBP.';
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) return 'Escolha uma imagem menor que 5 MB.';
    return '';
};

export const convertImageToWebp = (file, { maxDimension = 1200, quality = 0.82 } = {}) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
        image.onload = () => {
            const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
            const scale = Math.min(1, maxDimension / largestSide);
            const width = Math.max(1, Math.round(image.naturalWidth * scale));
            const height = Math.max(1, Math.round(image.naturalHeight * scale));
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            if (!context) return reject(new Error('Seu navegador não disponibilizou o processamento de imagem.'));
            context.drawImage(image, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', quality));
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
});
