import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSystemConfig, SystemConfig } from '../api/configApi';

interface ConfigContextType {
    features: SystemConfig['features'] | null;
    loading: boolean;
}

const ConfigContext = createContext<ConfigContextType>({ features: null, loading: true });

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
    const [features, setFeatures] = useState<SystemConfig['features'] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSystemConfig()
            .then((data) => setFeatures(data.features))
            .catch((err) => {
                console.error('Failed to load system config', err);
                setFeatures({ transcodingEnabled: true }); // Fallback
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <ConfigContext.Provider value={{ features, loading }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
