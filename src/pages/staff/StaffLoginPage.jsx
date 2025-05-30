import React, { useState } from 'react';
    import { useAuth } from '@/contexts/authHooks'; // Corrected import path
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
    import { motion } from 'framer-motion';
    import { LogIn, Eye, EyeOff, Zap } from 'lucide-react';
    import { Link } from 'react-router-dom';

    const StaffLoginPage = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const { login, loading } = useAuth();

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!loading) {
          await login(email, password);
        }
      };

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card className="w-full max-w-md shadow-2xl bg-slate-800/80 backdrop-blur-md border-indigo-500/30">
              <CardHeader className="text-center">
                <motion.div 
                  className="inline-block p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-4 shadow-lg"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                >
                  <Zap className="h-8 w-8 text-white" />
                </motion.div>
                <CardTitle className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Staff Portal</CardTitle>
                <CardDescription className="text-slate-400">Access to Jupiter Automation Systems</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="staff@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-indigo-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md" disabled={loading}>
                    {loading ? 'Logging In...' : <><LogIn className="mr-2 h-4 w-4" /> Login</>}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex-col items-center text-center space-y-3">
                 <p className="text-sm text-slate-400">
                  Not a staff member?{' '}
                  <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
                    Client Login
                  </Link>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  &copy; {new Date().getFullYear()} Jupiter Automation
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      );
    };

    export default StaffLoginPage;