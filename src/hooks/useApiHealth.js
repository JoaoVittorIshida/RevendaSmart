import { useCallback, useEffect, useState } from 'react';

const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const HEALTH_CHECK_RETRY_MS = 15000;
const HEALTH_CHECK_TIMEOUT_MS = 10000;

const getApiBaseUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useApiHealth = () => {
    const [health, setHealth] = useState({
        status: 'checking',
        isOnline: false,
        checkedAt: null
    });

    const checkHealth = useCallback(async () => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/health`, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal
            });
            const data = await response.json().catch(() => ({}));
            const isOnline = response.ok && data.status === 'online' && data.database === 'online';

            setHealth({
                status: isOnline ? 'online' : 'offline',
                isOnline,
                checkedAt: data.checked_at || new Date().toISOString()
            });

            return isOnline;
        } catch {
            setHealth({
                status: 'offline',
                isOnline: false,
                checkedAt: new Date().toISOString()
            });

            return false;
        } finally {
            window.clearTimeout(timeoutId);
        }
    }, []);

    useEffect(() => {
        let isActive = true;
        let timeoutId;

        const scheduleNextCheck = async () => {
            const isOnline = await checkHealth();

            if (!isActive) return;

            timeoutId = window.setTimeout(
                scheduleNextCheck,
                isOnline ? HEALTH_CHECK_INTERVAL_MS : HEALTH_CHECK_RETRY_MS
            );
        };

        scheduleNextCheck();

        return () => {
            isActive = false;
            window.clearTimeout(timeoutId);
        };
    }, [checkHealth]);

    return {
        ...health,
        checkHealth
    };
};
