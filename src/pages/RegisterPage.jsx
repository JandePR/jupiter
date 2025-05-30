import React, { useState } from 'react';
    import { useAuth } from '@/contexts/authHooks'; // Corrected import path
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
    import { motion } from 'framer-motion';
    import { UserPlus, Eye, EyeOff } from 'lucide-react';
    import { Link } from 'react-router-dom';
    import { useToast } from '@/components/ui/use-toast';

    const RegisterPage = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [name, setName] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const { register, loading } = useAuth();
      const { toast } = useToast();

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
          toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
          return;
        }
        if (!loading) {
          await register(email, password, name);
        }
      };

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card className="w-full max-w-md shadow-2xl bg-slate-800/80 backdrop-blur-md border-purple-500/30">
              <CardHeader className="text-center">
                <motion.div 
                  className="inline-block p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full mb-4 shadow-lg"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                >
                  <UserPlus className="h-8 w-8 text-white" />
                </motion.div>
                <CardTitle className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Create Account</CardTitle>
                <CardDescription className="text-slate-400">Join the Jupiter Automation Client Portal</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-slate-300">Password (min. 6 characters)</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-purple-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm-password" className="text-slate-300">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-purple-400"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md" disabled={loading}>
                    {loading ? 'Creating Account...' : <><UserPlus className="mr-2 h-4 w-4" /> Register</>}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex-col items-center text-center space-y-3">
                <p className="text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300 hover:underline">
                    Login here
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
    
    export default RegisterPage;