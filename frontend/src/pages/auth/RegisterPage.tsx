import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, Lock, User, UserPlus, Building2, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('renter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await register(name, email, password, role);
    } catch (error) {
      // Error is already handled in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section - Brand */}
      <div className="bg-primary-600 md:w-1/2 flex flex-col items-center justify-center text-white p-8">
        <div className="max-w-md w-full flex flex-col items-center">
          <Home size={72} className="mb-6" />
          <h1 className="text-4xl font-bold mb-4 text-center">HomeFinder</h1>
          <p className="text-center text-lg text-primary-100 mb-6">Find your perfect home with ease</p>
        </div>
      </div>
      
      {/* Right Section - Registration Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">Create Your Account</h2>
            <p className="text-center text-gray-500 mb-6">Join HomeFinder to find your dream apartment</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-500 rounded-md">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-2" />
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail size={16} className="inline mr-2" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock size={16} className="inline mr-2" />
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock size={16} className="inline mr-2" />
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`border rounded-md p-3 cursor-pointer transition-all ${
                      role === 'renter'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                    onClick={() => setRole('renter')}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UserRound size={24} />
                      <span className="font-medium">Renter</span>
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-md p-3 cursor-pointer transition-all ${
                      role === 'owner'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                    onClick={() => setRole('owner')}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Building2 size={24} />
                      <span className="font-medium">Property Owner</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Account
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:underline font-medium">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;