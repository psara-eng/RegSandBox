import { useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workspace/:documentId" element={<WorkspacePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;