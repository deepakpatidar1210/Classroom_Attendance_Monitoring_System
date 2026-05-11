import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import collegeImage from '../assets/college.jpg';
import api from '../api/axios';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = emailTouched && (!email ? 'Email is required' : !isEmailValid ? 'Please enter a valid email' : '');

  const passLengthError = password.length < 8 ? 'Password must be at least 8 characters' : password.length > 16 ? 'Password must be no more than 16 characters' : '';
  const passwordError = passwordTouched && passLengthError ? passLengthError : '';

  const handleLogin = async () => {
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!email || !password || emailError || passLengthError) {
      return toast.error('Please fix the errors before logging in');
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (showForgotPass) handleForgotPass();
      else handleLogin();
    }
  };

  const handleForgotPass = async () => {
    setEmailTouched(true);
    if (!email || emailError) {
      return toast.error('Please enter a valid email address');
    }
    setLoading(true);
    try {
      await api.post('/notifications/request-reset', { email });
      setResetSent(true);
      toast.success('Password reset request sent to Admin!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Left side - Cover Image */}
      <div style={{
        flex: 1,
        position: 'relative',
        backgroundImage: `url(${collegeImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'none', // Will be block on larger screens, handled via media query normally but we'll force it here
      }} className="desktop-only-bg">
        {/* Dark Teal Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(26, 54, 68, 0.85) 0%, rgba(44, 123, 142, 0.7) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px',
          color: 'white'
        }}>
          <div className="fade-in" style={{ maxWidth: '600px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '32px', marginBottom: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              A
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', lineHeight: 1.1 }}>
              AttendSoft
            </h1>
            <h2 style={{ fontSize: '24px', fontWeight: '400', opacity: 0.9, marginBottom: '24px' }}>
              Chameli Devi Group of Institutions
            </h2>
            <p style={{ fontSize: '16px', opacity: 0.8, lineHeight: 1.6, maxWidth: '80%' }}>
              Welcome to the modern classroom attendance monitoring system. Fast, reliable, and secure face-recognition powered attendance.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div style={{
        flex: '0 0 100%',
        maxWidth: '500px',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
        zIndex: 10
      }} className="login-form-container">
        
        <div className="fade-in" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
              Welcome Back
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Please sign in to your account
            </p>
          </div>

          {!showForgotPass ? (
            <>
              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>Email Address</label>
                <input
                  className={`form-input ${emailError ? 'error' : ''}`}
                  style={{ padding: '14px 16px' }}
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  onKeyDown={handleKeyDown}
                />
                {emailError && <span className="error-text">{emailError}</span>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={`form-input ${passwordError ? 'error' : ''}`}
                    style={{ padding: '14px 16px', paddingRight: '40px' }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '16px', cursor: 'pointer' }}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {passwordError && <span className="error-text">{passwordError}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                <button type="button" onClick={() => setShowForgotPass(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Forgot Password?
                </button>
              </div>

              {/* Login btn */}
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600', borderRadius: '10px' }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
              
              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Need help accessing your account? Contact IT Support.
              </p>
            </>
          ) : (
            <>
              {resetSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 24px' }}>✓</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '12px' }}>Request Sent</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
                    Your password reset request has been sent to the administrator. You will be notified once it is resolved.
                  </p>
                  <button className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '10px' }} onClick={() => { setShowForgotPass(false); setResetSent(false); }}>
                    Back to Login
                  </button>
                </div>
              ) : (
                <div className="fade-in">
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>Email Address</label>
                    <input
                      className={`form-input ${emailError ? 'error' : ''}`}
                      style={{ padding: '14px 16px' }}
                      type="email"
                      placeholder="Enter your registered email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      onKeyDown={handleKeyDown}
                    />
                    {emailError && <span className="error-text">{emailError}</span>}
                  </div>

                  <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600', borderRadius: '10px', marginBottom: '16px' }}
                    onClick={handleForgotPass}
                    disabled={loading}
                  >
                    {loading ? 'Sending Request...' : 'Send Reset Request'}
                  </button>

                  <button type="button" onClick={() => setShowForgotPass(false)} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: '10px' }}>
                    Back to Login
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .desktop-only-bg {
            display: block !important;
          }
          .login-form-container {
            flex: 0 0 400px !important;
            max-width: none !important;
          }
        }
        @media (min-width: 1200px) {
          .login-form-container {
            flex: 0 0 500px !important;
          }
        }
      `}</style>
    </div>
  );
}
