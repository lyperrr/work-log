import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

import { LogIn, UserPlus, Lock, Mail, User, AlertCircle } from 'lucide-react';


export function AuthPage() {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        if (password.length < 6) {
          throw new Error('Password minimal 6 karakter');
        }
        await register(username, email, password);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
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
              <TabsList className="w-full">
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
                  <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <User className="size-4 text-primary" />
                    Nama Pengguna (Username)
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
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Mail className="size-4 text-primary" />
                  Alamat Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Lock className="size-4 text-primary" />
                  Kata Sandi (Password)
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                disabled={loading}
              >
                {activeTab === 'login' ? (
                  <>
                    <LogIn className='size-4' />
                    {loading ? 'Memproses...' : 'Masuk ke Aplikasi'}
                  </>
                ) : (
                  <>
                    <UserPlus className='size-4' />
                    {loading ? 'Mendaftarkan...' : 'Buat Akun Baru'}
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
                    className="w-full"
                    disabled={loading}
                    onClick={async () => {
                      setErrorMsg('');
                      setLoading(true);
                      try {
                        await login('budi@klinik.com', 'password123');
                      } catch (err) {
                        setErrorMsg(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <LogIn className='size-4' />
                    {loading ? 'Memproses...' : 'Masuk sebagai Demo'}
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

