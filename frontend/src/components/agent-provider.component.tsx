import { AgentWasm } from "@/agent"
import { createContext, useContext, useEffect, useState } from "react";

type AgentProviderState = {
    agent: AgentWasm | null;
    error?: Error;
    isLoading: boolean;
}

const initialState: AgentProviderState = {
    agent: null,
    error: undefined,
    isLoading: true,
}

const AgentProviderContext = createContext<AgentProviderState>(initialState);

export function AgentProvider({ children }: { children: React.ReactNode }) {
    const [agent, setAgent] = useState<AgentWasm | null>(null);
    const [error, setError] = useState<Error>();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (isLoading) return;
        setIsLoading(true);
        AgentWasm.new().then((a) => {
            setAgent(a);
            setIsLoading(false);
        }).catch((err) => setError(err));
        return () => agent?.deinit();
    }, []);

    const value = { agent, error, isLoading };

    return (
        <AgentProviderContext.Provider value={value}>
            {children}
        </AgentProviderContext.Provider>
    )
}

export function useAgent() {
    const context = useContext(AgentProviderContext);

    if (context === undefined)
        throw new Error("useAgent must be used within a ThemeProvider");

    return context;
}