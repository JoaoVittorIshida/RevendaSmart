const ApiHealthIndicator = ({ isOnline, status }) => {
    const label = isOnline ? 'API e banco online' : 'Servidor iniciando';

    return (
        <div className="auth-health-indicator" title={label} aria-label={label}>
            <span
                className={`auth-health-dot ${isOnline ? 'auth-health-dot-online' : 'auth-health-dot-offline'}`}
                aria-hidden="true"
            />
            <span className="sr-only">{status === 'checking' ? 'Verificando servidor' : label}</span>
        </div>
    );
};

export default ApiHealthIndicator;