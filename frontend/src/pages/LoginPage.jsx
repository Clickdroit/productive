import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

export default function LoginPage() {
    const { login } = useAuth();
    const [authError, setAuthError] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data) => {
        setAuthError('');
        try {
            await login(data.email, data.password);
        } catch (err) {
            setAuthError(err.response?.data?.error || 'Erreur de connexion');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
            {/* Background gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md animate-fade-in relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-brand-500/25">
                            ⚡
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
                            Productive
                        </h1>
                    </div>
                    <p className="text-zinc-400">Connecte-toi à ton dashboard</p>
                </div>

                {/* Card */}
                <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 space-y-5">
                    {authError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-scale-in">
                            {authError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            {...register('email')}
                            className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            placeholder="ton@email.com"
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Mot de passe</label>
                        <input
                            type="password"
                            {...register('password')}
                            className={`input-field ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
                    </div>

                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Connexion...
                            </span>
                        ) : 'Se connecter'}
                    </button>

                    <p className="text-center text-sm text-zinc-500">
                        Pas encore de compte ?{' '}
                        <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
                            Créer un compte
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
