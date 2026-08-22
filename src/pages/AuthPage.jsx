import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Spinner } from '../components/ui/spinner';

import { LogIn, UserPlus, Lock, Mail, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { IosInstallPrompt } from '../components/common/IosInstallPrompt';
import { getFriendlyErrorMessage } from '../lib/utils';

export function AuthPage() {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [loadingAction, setLoadingAction] = useState(null); // 'submit' | 'demo' | null

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoadingAction('submit');

    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();
      const cleanUsername = (username || '').trim();

      if (!cleanEmail || !cleanPassword) {
        throw new Error('Email dan password wajib diisi');
      }

      if (activeTab === 'login') {
        await login(cleanEmail, cleanPassword);
      } else {
        if (!cleanUsername) {
          throw new Error('Nama lengkap / username wajib diisi');
        }
        if (cleanPassword.length < 6) {
          throw new Error('Password minimal 6 karakter');
        }
        await register(cleanUsername, cleanEmail, cleanPassword);
      }
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err, 'Gagal memproses data otentikasi'));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* App Logo Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo-kinesis-corpus.png"
            alt="Logo Kinesis Corpus"
            className="w-20 h-20 object-contain mx-auto rounded-2xl p-1 bg-card shadow-md border-2 border-primary/20"
          />
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Pencatatan Freelance
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            Kunjungan Pasien & Ringkasan Pemasukan
          </p>
        </div>

        {/* iOS PWA Installation Banner */}
        <IosInstallPrompt />

        {/* Auth Card using shadcn Card */}
        <Card className="border-2 border-border rounded-3xl shadow-xl">
          <CardHeader className="pb-3">
            {/* Tab Switcher */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val);
                setErrorMsg('');
              }}
            >
              <TabsList className="w-full h-12!">
                <TabsTrigger value="login">
                  <LogIn />
                  Masuk
                </TabsTrigger>
                <TabsTrigger value="register">
                  <UserPlus />
                  Daftar Akun
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Error Alert using shadcn Alert */}
            {errorMsg && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {/* Auth Form using shadcn Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <User className="size-4 text-primary" />
                    Nama Pengguna
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    required
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                  <Mail className="size-4 text-primary" />
                  Alamat Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="h-13"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                  <Lock className="size-4 text-primary" />
                  Kata Sandi
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="pr-10 h-13"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 size-8 text-muted-foreground hover:text-foreground"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2 font-bold h-11 sm:h-10"
                disabled={Boolean(loadingAction)}
              >
                {loadingAction === 'submit' ? (
                  <>
                    <Spinner className="size-4 shrink-0" />
                    <span>{activeTab === 'login' ? 'Memproses...' : 'Mendaftarkan...'}</span>
                  </>
                ) : activeTab === 'login' ? (
                  <>
                    <LogIn className="size-4 shrink-0" />
                    <span>Masuk ke Aplikasi</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4 shrink-0" />
                    <span>Buat Akun Baru</span>
                  </>
                )}
              </Button>

              {/* Demo login — hanya tampil di tab Masuk */}
              {activeTab === 'login' && (
                <>
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-muted-foreground">Atau</span>
                    <div className="flex-1 border-t border-border" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full font-bold h-11 sm:h-10"
                    disabled={Boolean(loadingAction)}
                    onClick={async () => {
                      setErrorMsg('');
                      setLoadingAction('demo');
                      try {
                        await login('budi@klinik.com', 'password123');
                      } catch (err) {
                        setErrorMsg(err.message);
                      } finally {
                        setLoadingAction(null);
                      }
                    }}
                  >
                    {loadingAction === 'demo' ? (
                      <>
                        <Spinner className="size-4 shrink-0" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="size-4 shrink-0" />
                        <span>Masuk sebagai Demo</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}

