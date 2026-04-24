import React, { useState } from 'react';
import { Coffee, Key, User, ShieldCheck, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useKachinoStore } from '../store/useKachinoStore';

const Login = () => {
  const { login } = useKachinoStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (role) => {
    if (pin.length !== 4) {
      setError("Please enter a valid 4-digit PIN");
      return;
    }
    const success = login(role, pin);
    if (success) {
      toast.success('Access Granted', { description: `Welcome back, ${role}!` });
      // Minor delay to allow state to settle before reload for absolute reliability
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      setError("Invalid PIN for this role");
      toast.error('Access denied', { description: 'Incorrect PIN for selected role' });
      setPin("");
    }
  };

  const addDigit = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError("");
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'var(--bg-deep)', position: 'fixed', inset: 0, padding: 'var(--container-padding)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="menu-card login-card"
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          padding: 'clamp(15px, 4vw, 40px)', 
          textAlign: 'center', 
          background: 'var(--bg-surface)',
          margin: '0 auto',
          maxHeight: '95vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ marginBottom: 'clamp(15px, 3vh, 30px)' }}>
          <div style={{ background: 'var(--accent-gold-soft)', width: 'clamp(40px, 12vw, 70px)', height: 'clamp(40px, 12vw, 70px)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
            <Coffee size={28} color="var(--accent-gold)" />
          </div>
          <h1 style={{ fontSize: 'var(--font-h2)', marginBottom: '4px' }}>Cafe Kachino</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Secure POS Terminal Entry</p>
        </div>

        <div style={{ marginBottom: 'clamp(15px, 3vh, 25px)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 2vw, 15px)', marginBottom: '8px' }}>
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: pin.length > i ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.2s ease'
                }} 
              />
            ))}
          </div>
          {error && <div style={{ color: '#f87171', fontSize: 'var(--font-xs)' }}>{error}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(8px, 2vw, 15px)', marginBottom: 'clamp(15px, 3vh, 30px)' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num} 
              className="tab" 
              style={{ 
                height: 'clamp(45px, 10vh, 60px)', 
                borderRadius: '15px', 
                fontSize: 'var(--font-h2)', 
                padding: 0, 
                background: 'rgba(255,255,255,0.03)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.05)',
                fontWeight: '600'
              }}
              onClick={() => addDigit(num.toString())}
            >
              {num}
            </button>
          ))}
          <button 
            className="tab" 
            style={{ height: 'clamp(45px, 10vh, 60px)', borderRadius: '15px', fontSize: 'var(--font-xs)', color: '#f87171', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.1)' }} 
            onClick={() => setPin("")}
          >
            Clear
          </button>
          <button 
            className="tab" 
            style={{ 
              height: 'clamp(45px, 10vh, 60px)', 
              borderRadius: '15px', 
              fontSize: 'var(--font-h2)', 
              padding: 0, 
              background: 'rgba(255,255,255,0.03)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.05)',
              fontWeight: '600'
            }} 
            onClick={() => addDigit("0")}
          >
            0
          </button>
          <button 
            className="tab" 
            style={{ height: 'clamp(45px, 10vh, 60px)', borderRadius: '15px', color: 'var(--accent-gold)', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.1)' }} 
            onClick={() => setPin(prev => prev.slice(0, -1))}
          >
            ⌫
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <button 
            className="tab" 
            style={{ 
              fontSize: 'var(--font-sm)', 
              padding: '12px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--glass-border)', 
              color: 'white',
              borderRadius: '12px'
            }}
            onClick={() => handleLogin('staff')}
          >
            Staff
          </button>
          <button 
            className="pay-button" 
            style={{ 
              fontSize: 'var(--font-sm)', 
              padding: '12px',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)'
            }}
            onClick={() => handleLogin('admin')}
          >
            Manager
          </button>
        </div>

        <div style={{ marginTop: 'clamp(15px, 3vh, 20px)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Lock size={12} />
          Terminal ID: KCH-449
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
