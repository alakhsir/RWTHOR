import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Save, Loader2, Award, Calendar } from 'lucide-react';

export const ProfilePage = () => {
    const { profile, updateProfile, loading: authLoading } = useAuth();

    const [fullName, setFullName] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
        }
    }, [profile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await updateProfile({ full_name: fullName });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 p-6">
                <div className="h-10 w-48 bg-gray-800 rounded animate-pulse" />
                <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-8 space-y-8">
                    <div className="flex items-center gap-6 pb-6 border-b border-gray-800">
                        <div className="w-20 h-20 bg-gray-800 rounded-2xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="col-span-2 space-y-2">
                            <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
                            <div className="h-12 w-full bg-gray-800 rounded animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
                            <div className="h-12 w-full bg-gray-800 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in relative z-0">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl -z-10" />

            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    My Profile
                </h1>
                <p className="text-gray-400 mt-2">Manage your personal information and account settings</p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6 pb-6 border-b border-gray-800">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                            {(fullName || profile?.phone || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{fullName || 'Student'}</h3>
                            <p className="text-indigo-400 text-sm font-medium">{profile?.role?.toUpperCase() || 'STUDENT'}</p>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-400" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white placeholder-gray-600 transition-all hover:bg-black/30"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-indigo-400" />
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={profile?.phone || ''}
                                disabled
                                className="w-full px-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-gray-400 cursor-not-allowed font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-400" />
                                Subscription
                            </label>
                            <div className="w-full px-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-gray-400 flex items-center justify-between">
                                <span className="capitalize">{profile?.subscription_status || 'Free'}</span>
                                {profile?.subscription_status === 'paid' && (
                                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">PRO</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
