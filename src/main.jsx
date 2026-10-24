import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './styles.css';
import App from './App.jsx';
import { applyTheme } from './lib/config.js';

applyTheme();
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
