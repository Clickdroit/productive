import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères'),
});

export default function RegisterPage() {
    const { register: authRegister } = useAuth();
    const [authError, setAuthError] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data) => {
        setAuthError('');
        try {
            await authRegister(data.email, data.password, data.name);
        } catch (err) {
            setAuthError(err.response?.data?.error || "Erreur lors de l'inscription");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md animate-fade-in relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-brand-500/25">
                            ⚡
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
                            Productive
                        </h1>
                    </div>
                    <p className="text-zinc-400">Crée ton compte</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 space-y-5">
                    {authError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-scale-in">
                            {authError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nom</label>
                        <input
                            type="text"
                            {...register('name')}
                            className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            placeholder="Ton nom"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
                    </div>

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
                            placeholder="Min. 6 caractères"
                        />
                        {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
                    </div>

                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Création...
                            </span>
                        ) : 'Créer mon compte'}
                    </button>

                    <p className="text-center text-sm text-zinc-500">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
                            Se connecter
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
