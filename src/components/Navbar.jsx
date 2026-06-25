import { Link, useLocation } from 'react-router-dom'
import { QUESTIONS } from '../data/questions'

export default function Navbar() {
  const location = useLocation()
  const inTest = location.pathname === '/test'

  if (inTest) {
    return (
      <nav className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-black">IC</span>
            </div>
            <span className="font-bold text-slate-700 text-sm hidden sm:block">ICFES Saber 11</span>
          </Link>
          <span className="text-xs text-slate-400 italic">Modo examen — <Link to="/" className="text-indigo-500 hover:underline">Salir</Link></span>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-200 transition-shadow duration-200">
            <span className="text-white text-xs font-black">IC</span>
          </div>
          <div>
            <span className="font-bold text-slate-800 text-base leading-none block">ICFES Saber 11</span>
            <span className="text-xs text-slate-400 leading-none">{QUESTIONS.length} preguntas</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink to="/" active={location.pathname === '/'}>Inicio</NavLink>
          <NavLink to="/seleccion" active={location.pathname === '/seleccion'}>Practicar</NavLink>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-indigo-100 text-indigo-700 shadow-sm'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  )
}
