import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom'
import { TestProvider } from './context/TestContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import TestSelection from './pages/TestSelection'
import TestRunner from './pages/TestRunner'
import Results from './pages/Results'

export default function App() {
  return (
    <BrowserRouter>
      <TestProvider>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/seleccion" element={<TestSelection />} />
            <Route path="/test" element={<TestRunner />} />
            <Route path="/resultados" element={<Results />} />
          </Routes>
        </div>
      </TestProvider>
    </BrowserRouter>
  )
}
