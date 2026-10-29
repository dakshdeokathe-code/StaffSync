import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import { store } from './store';
import App from './App';
createRoot(document.getElementById('root')).render(<React.StrictMode><Provider store={store}><BrowserRouter><App /></BrowserRouter></Provider></React.StrictMode>);
