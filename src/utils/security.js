import CryptoJS from 'crypto-js';

const SECRET_KEY = 'kachino-secure-terminal-key-2024';

export const encrypt = (data) => {
  try {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

export const decrypt = (ciphertext) => {
  try {
    if (!ciphertext) return null;
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(originalText);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

// Custom storage wrapper for Zustand persistence
export const encryptedStorage = {
  getItem: (name) => {
    const value = localStorage.getItem(name);
    return decrypt(value);
  },
  setItem: (name, value) => {
    const ciphertext = encrypt(value);
    localStorage.setItem(name, ciphertext);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};
