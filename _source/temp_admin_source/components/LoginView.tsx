import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    if (email && password) {
        onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-12 text-center bg-sidebar text-white relative overflow-hidden">
            <div className="relative z-10">
                <h1 className="text-4xl font-serif italic tracking-wide mb-2">Helen</h1>
                <p className="text-gray-400 text-sm">Admin Panel Access</p>
            </div>
            {/* Abstract shapes for design */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
        </div>
        
        <div className="p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input 
                        type="email" 
                        required
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        placeholder="admin@helen.app"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input 
                        type="password" 
                        required
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                
                <button 
                    type="submit"
                    className="w-full bg-sidebar text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-gray-200"
                >
                    Ingresar
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-8">
                &copy; 2023 Helen Inc. Protected System.
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
