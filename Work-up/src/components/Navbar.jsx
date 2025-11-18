import React, { useState, useEffect, useRef } from "react";
import CadastroCard from "./CadastroCard.jsx";
import LoginCard from "./LoginCard.jsx";
import Toast from "../components/Toast";
import logo from "../assets/IMG/Work-UP_logo-Principal.png";
import { Menu, X } from "lucide-react";

const MOBILE_BREAKPOINT = 880;

export default function Navbar() {
  const [showCadastro, setShowCadastro] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };
  
  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setMobileOpen(v => !v);
        setMenuOpen(false);
    } else {
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setMenuOpen(false);
    setMobileOpen(false);
    window.location.href = "/";
  };
  
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
    window.location.reload(); 
  };

  const isMobileView = window.innerWidth <= MOBILE_BREAKPOINT;

  return (
    <>
      <header className="nav">
        <div className="container nav__inner">
          <a href="/" className="brand" aria-label="Kairos Home">
            <img src={logo} alt="Kairos" className="brand__logo" />
          </a>

          {/* mobile menu toggle */}
          <button
            className="nav__toggle"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            onClick={handleToggleMenu}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className={`menu ${mobileOpen ? 'menu--open' : ''}`} aria-label="Menu Principal">
            <a href="/" onClick={closeMobileMenu}>Início</a>
            <a href="/eventos" onClick={closeMobileMenu}>Eventos</a>
            <a href="/projetos" onClick={closeMobileMenu}>Projetos</a>
            <a href="/evolucao" onClick={closeMobileMenu}>Evolução</a>
            {user && (
               <a href="/perfil?tab=dashboard" onClick={closeMobileMenu}>Dashboard</a>
            )}

            {user && isMobileView && (
              <>
                <div className="mobile-divider" style={{ borderTop: '1px solid rgba(0,0,0,0.1)', margin: '5px 0', width: '100%' }}></div>
                <a href="/perfil" onClick={closeMobileMenu}>Perfil</a>
                <a 
                    href="#" 
                    onClick={handleLogout} 
                    className="menu-logout-link" 
                >
                    Sair
                </a>
              </>
            )}
          </nav>
            
          <div className="nav__actions">
            {!user ? (
              // BOTOES DESLOGADO
              <>
                <button
                  className="btn"
                  onClick={() => {
                    setShowCadastro(false);
                    setShowLogin(true);
                  }}
                >
                  Entrar
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setShowLogin(false);
                    setShowCadastro(true);
                  }}
                >
                  Criar conta
                </button>
              </>
            ) : (
              // MENU DROPDOWN
              <div className="user-menu" ref={dropdownRef}>
                <div
                  className="user-info"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
              <img
                  src={(user.aluno?.fotoUrl || user.empresa?.fotoUrl) || "/default-avatar.png"}
                  alt={user.email}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "2px solid #3298EF", 
                  }}
                  />
                  {!mobileOpen && (menuOpen ? <X size={24} /> : <Menu size={24} />)}
                </div>

                {menuOpen && (
                  <ul className="dropdown">
                    <li><a href="/perfil" onClick={() => setMenuOpen(false)}>Perfil</a></li>
                    <li 
                      onClick={handleLogout}
                      style={{ cursor: 'pointer' }}
                    >
                      Sair
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MODAIS*/}
      {showCadastro && (
        <div className="modal-overlay" onClick={() => setShowCadastro(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <CadastroCard onClose={() => setShowCadastro(false)} />
          </div>
        </div>
      )}

      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <LoginCard
              onLoginSuccess={handleLoginSuccess}
              onClose={() => setShowLogin(false)}
              onShowToast={setToast}
            />
          </div>
        </div>
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}