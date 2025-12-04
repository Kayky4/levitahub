import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile as IUserProfile } from '../../services/types';
import { useToast } from '../../context/ToastContext';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

// --- HELPER: GENERATE GRADIENT FROM UID ---
const generateCoverGradient = (uid: string) => {
  const gradients = [
    'from-indigo-600 via-purple-600 to-pink-600',
    'from-blue-600 via-cyan-500 to-teal-400',
    'from-rose-500 via-orange-500 to-amber-400',
    'from-emerald-500 via-green-500 to-lime-400',
    'from-slate-800 via-slate-700 to-slate-600', // Midnight Special
  ];
  const index = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
};

// --- COMPONENT: TAG INPUT ---
interface TagInputProps {
  tags: string[];
  onChange: (newTags: string[]) => void;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim();
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
        setInput('');
      }
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
      {tags.map(tag => (
        <span key={tag} className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 px-2 py-1 rounded-lg text-sm font-medium flex items-center gap-1 animate-in fade-in zoom-in duration-200">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900 dark:hover:text-white">×</button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 bg-transparent outline-none min-w-[120px] text-sm text-gray-900 dark:text-white placeholder-gray-400"
      />
    </div>
  );
};

// --- MAIN PAGE ---
const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Tabs State
  const [activeTab, setActiveTab] = useState<'general' | 'musician' | 'security'>('general');

  // Form Data State
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [bandsCount, setBandsCount] = useState(0);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Refs
  const initialData = useRef({ displayName: '', bio: '', instruments: [] as string[] });

  // Load Data
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as IUserProfile;
          setDisplayName(data.displayName || user.displayName || '');
          setBio(data.bio || '');
          setInstruments(data.instruments || []);
          setBandsCount(data.bands ? Object.keys(data.bands).length : 0);

          // Set initial for dirty checking
          initialData.current = {
            displayName: data.displayName || user.displayName || '',
            bio: data.bio || '',
            instruments: data.instruments || []
          };
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Dirty Check Effect
  useEffect(() => {
    if (loading) return;

    // Compare array content manually to avoid JSON.stringify circular reference issues
    const currentInst = instruments || [];
    const initialInst = initialData.current.instruments || [];
    const instrumentsChanged =
      currentInst.length !== initialInst.length ||
      !currentInst.every((val, index) => val === initialInst[index]);

    const hasChanged =
      displayName !== initialData.current.displayName ||
      bio !== initialData.current.bio ||
      instrumentsChanged;

    setIsDirty(hasChanged);
  }, [displayName, bio, instruments, loading]);

  // Save Handler
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Update Auth Profile
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }

      // 2. Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        bio,
        instruments
      });

      // Update refs
      initialData.current = { displayName, bio, instruments };
      setIsDirty(false);
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Senha alterada com sucesso!', 'success');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        showToast('Por segurança, faça login novamente antes de trocar a senha.', 'error');
      } else {
        showToast('Erro ao alterar senha. Tente novamente.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const coverGradient = generateCoverGradient(user.uid);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 pb-24 transition-colors duration-300">

      {/* 1. COVER AREA */}
      <div className={`h-48 md:h-64 w-full bg-gradient-to-r ${coverGradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 p-20 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 p-32 bg-black opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* 2. LEVITA ID CARD (Left Column) */}
          <div className="lg:col-span-4">
            <GlassCard
              noPadding
              className="flex flex-col items-center text-center pt-0 pb-8 px-6 sticky top-24 overflow-visible"
            >
              {/* Avatar Floating */}
              <div className="-mt-16 mb-4 relative mx-auto">
                <div className="h-32 w-32 rounded-full border-4 border-white dark:border-midnight-800 bg-white dark:bg-midnight-800 shadow-xl flex items-center justify-center text-4xl font-bold text-gray-800 dark:text-white overflow-hidden">
                  {/* Fallback Avatar or Image if we had one */}
                  <div className={`w-full h-full bg-gradient-to-br ${coverGradient} flex items-center justify-center text-white`}>
                    {displayName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-white dark:border-midnight-800 rounded-full" title="Online"></div>
              </div>

              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                {displayName || 'Levita'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">{user.email}</p>

              {/* Badges / Stats */}
              <div className="flex gap-2 mb-6 justify-center">
                <Badge variant="purple" size="sm">Músico</Badge>
                <Badge variant="neutral" size="sm">{bandsCount} {bandsCount === 1 ? 'Banda' : 'Bandas'}</Badge>
                <Badge variant="info" size="sm">Desde {new Date(user.metadata.creationTime || Date.now()).getFullYear()}</Badge>
              </div>



              {/* Instrument Tags Display */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {instruments.map(inst => (
                  <span key={inst} className="text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                    {inst}
                  </span>
                ))}
                {instruments.length === 0 && (
                  <span className="text-xs text-gray-400">Sem instrumentos definidos</span>
                )}
              </div>

              <div className="w-full pt-6 border-t border-gray-100 dark:border-white/10">
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">LEVITA ID</div>
                <div className="bg-gray-50 dark:bg-black/30 rounded-lg p-2 flex items-center justify-between group cursor-pointer hover:bg-gray-100 dark:hover:bg-black/50 transition-colors"
                  onClick={() => { navigator.clipboard.writeText(user.uid); showToast('ID copiado!', 'success'); }}>
                  <code className="text-xs font-mono text-gray-500 truncate max-w-[200px]">{user.uid}</code>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* 3. PASSPORT (Tabs & Form) - Right Column */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-midnight-800 rounded-2xl shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 dark:border-white/5 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Geral
                </button>
                <button
                  onClick={() => setActiveTab('musician')}
                  className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'musician' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Perfil Musical
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'security' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Segurança
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 md:p-8 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'general' && (
                    <motion.div
                      key="general"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 gap-6">
                        <Input
                          label="Nome de Exibição"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Como você quer ser chamado?"
                        />
                        <Input
                          label="Email"
                          value={user.email || ''}
                          disabled
                          className="opacity-60 bg-gray-50 dark:bg-black/40 cursor-not-allowed"
                          helperText="O email é sua chave de acesso única."
                          rightElement={<span className="text-gray-400 text-xs">🔒</span>}
                        />

                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'musician' && (
                    <motion.div
                      key="musician"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex gap-3 items-start">
                        <span className="text-2xl">🎸</span>
                        <div>
                          <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Identidade Musical Global</h4>
                          <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                            Os instrumentos adicionados aqui aparecerão no seu perfil público para todas as suas bandas.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Seus Instrumentos
                        </label>
                        <TagInput
                          tags={instruments}
                          onChange={setInstruments}
                          placeholder="Digite e dê Enter (ex: Violão, Voz)"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Pressione <strong>Enter</strong> ou <strong>Vírgula</strong> para adicionar.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-gray-200 dark:border-white/5 pb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Alterar Senha</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            type="password"
                            label="Nova Senha"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 6 caracteres"
                          />
                          <Input
                            type="password"
                            label="Confirmar Senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                          />
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="secondary"
                            onClick={handleChangePassword}
                            disabled={!newPassword || !confirmPassword || saving}
                            isLoading={saving}
                          >
                            Atualizar Senha
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Zona de Perigo</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Ações irreversíveis relacionadas à sua conta.
                        </p>
                        <Button variant="danger" onClick={() => window.open(`https://wa.me/5531988702098?text=${encodeURIComponent(`Olá, quero solicitar a exclusão da minha conta do LevitaHub. Meu ID: ${user.uid}`)}`, '_blank')}>
                          Solicitar Exclusão de Conta
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE FLOATING SAVE BAR (Only visible if dirty and not in security tab) */}
      <AnimatePresence>
        {isDirty && activeTab !== 'security' && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-midnight-800 border-t border-gray-200 dark:border-white/10 p-4 shadow-2xl z-50 md:hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Alterações pendentes...</span>
              <Button onClick={handleSaveProfile} isLoading={saving} className="px-8">
                Salvar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SAVE BUTTON (Inside Tab Content is messy, better stick to context) */}
      {/* Actually, we rendered the form inputs above. We need a save button for General/Musician tabs in Desktop view */}
      {activeTab !== 'security' && (
        <div className="hidden md:block fixed bottom-8 right-8 z-40">
          <AnimatePresence>
            {isDirty && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              >
                <Button
                  onClick={handleSaveProfile}
                  isLoading={saving}
                  className="shadow-2xl shadow-indigo-500/40 px-8 py-4 rounded-full text-lg"
                  leftIcon={<span>💾</span>}
                >
                  Salvar Alterações
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
};

export default UserProfile;