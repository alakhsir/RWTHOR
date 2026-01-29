import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signInWithOtp: (phone: string) => Promise<{ error: any }>;
    signInWithEmailOtp: (email: string) => Promise<{ error: any }>;
    signInWithGoogle: () => Promise<{ error: any }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
    verifyEmailOtp: (email: string, token: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        // Get initial session
        supabase.auth.getSession().then(({ data: { session }, error }) => {

            if (error) {
                console.error('AuthProvider: Error getting session', error);
                setLoading(false);
                return;
            }

            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {

                fetchProfile(session.user.id);
            } else {

                setLoading(false);
            }
        }).catch(err => {
            console.error('AuthProvider: Unexpected error in getSession', err);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {

            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Safety timeout to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('AuthProvider: Loading timed out. Forcing completion.');
                setLoading(false);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [loading]);

    const fetchProfile = async (userId: string) => {
        try {


            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timed out')), 10000)
            );

            // Race the fetch against the timeout
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data, error } = await Promise.race([
                fetchPromise,
                timeoutPromise
            ]) as any;

            if (error) {
                console.error('Error fetching profile:', error);
                // If profile doesn't exist, we should still allow login? 
                // Creating a simplified profile locally to stop loading?
                // For now, just logging.
            } else {

                setProfile(data);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        } finally {

            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        try {
            if (!user) return { error: 'No user logged in' };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (!error) {
                // Refresh profile locally
                await fetchProfile(user.id);
            }
            return { error };
        } catch (err) {
            return { error: err };
        }
    };

    const signInWithOtp = async (phone: string) => {
        // Supabase requires phone numbers to start with country code, e.g., +919999999999
        // Ensure the phone number passed here has the country code
        const { error } = await supabase.auth.signInWithOtp({
            phone,
        });
        return { error };
    };

    const verifyOtp = async (phone: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
        return { data, error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
    };

    const signInWithEmailOtp = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
        });
        return { error };
    };

    const verifyEmailOtp = async (email: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });
        return { data, error };
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        return { error };
    };

    const value = {
        session,
        user,
        profile,
        loading,
        signInWithOtp,
        signInWithEmailOtp,
        signInWithGoogle,
        verifyOtp,
        verifyEmailOtp,
        signOut,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
