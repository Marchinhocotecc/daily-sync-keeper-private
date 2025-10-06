import React from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export const GlobalStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [authError, setAuthError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!isSupabaseConfigured()) {
			setAuthError('Supabase not configured: set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
			return;
		}
		// Keep session in sync if needed
		const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
			// ...existing code that updates your global auth state...
		});
		return () => {
			sub.subscription?.unsubscribe?.();
		};
	}, []);

	// Example: wrap your existing login action to capture errors
	const login = React.useCallback(async (email: string, password: string) => {
		try {
			setAuthError(null);
			const { loginWithEmailPassword } = await import('../services/authService');
			await loginWithEmailPassword(email, password);
			// ...existing code (navigation, state updates)...
		} catch (e: any) {
			setAuthError(e?.message || 'Connessione a Supabase non riuscita: controlla configurazione');
		}
	}, []);
	// expose login in context if applicable

	return (
		<>
			{authError && (
				<div role="alert" style={{ color: 'crimson', padding: 8, marginBottom: 8 }}>
					{authError}
				</div>
			)}
			{children}
		</>
	);
};
