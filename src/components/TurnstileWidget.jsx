import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'cloudflare-turnstile-script';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise;

const loadTurnstile = () => {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.getElementById(SCRIPT_ID);
        const script = existingScript || document.createElement('script');

        const handleLoad = () => {
            if (window.turnstile) resolve(window.turnstile);
            else reject(new Error('A API do Turnstile não foi carregada.'));
        };
        const handleError = () => reject(new Error('Não foi possível carregar o Turnstile.'));

        script.addEventListener('load', handleLoad, { once: true });
        script.addEventListener('error', handleError, { once: true });

        if (!existingScript) {
            script.id = SCRIPT_ID;
            script.src = SCRIPT_URL;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
    }).catch((error) => {
        document.getElementById(SCRIPT_ID)?.remove();
        scriptPromise = undefined;
        throw error;
    });

    return scriptPromise;
};

const TurnstileWidget = ({ siteKey, onVerify, onExpire, onError, resetSignal = 0 }) => {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        callbacksRef.current = { onVerify, onExpire, onError };
    }, [onVerify, onExpire, onError]);

    useEffect(() => {
        if (!siteKey) return undefined;

        let active = true;

        loadTurnstile()
            .then((turnstile) => {
                if (!active || !containerRef.current) return;
                widgetIdRef.current = turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    action: 'register',
                    theme: 'auto',
                    size: 'flexible',
                    language: 'pt-br',
                    callback: (token) => callbacksRef.current.onVerify?.(token),
                    'expired-callback': () => callbacksRef.current.onExpire?.(),
                    'error-callback': () => {
                        callbacksRef.current.onError?.();
                        return true;
                    }
                });
            })
            .catch(() => {
                if (!active) return;
                setLoadError('Não foi possível carregar a verificação de segurança.');
                callbacksRef.current.onError?.();
            });

        return () => {
            active = false;
            if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [siteKey]);

    useEffect(() => {
        if (widgetIdRef.current !== null && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
        }
    }, [resetSignal]);

    const displayedError = siteKey ? loadError : 'Verificação de segurança não configurada.';

    return (
        <div>
            <div ref={containerRef} className="min-h-[65px] w-full" />
            {displayedError && (
                <p className="mt-2 text-center text-sm font-medium text-red-600 dark:text-red-400" role="alert">
                    {displayedError}
                </p>
            )}
        </div>
    );
};

export default TurnstileWidget;
