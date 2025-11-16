import React, { useState } from "react";
import "../css/CardLogin.css";
import api from '../service/api';
import { FaHandPaper, FaKey, FaSync } from "react-icons/fa";

export default function LoginCard({ onLoginSuccess, onClose, onShowToast }) {
  const [formData, setFormData] = useState({ email: "", senha: "" });
  const [resetData, setResetData] = useState({
    email: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [alert, setAlert] = useState("");
  const [resetMode, setResetMode] = useState(false);

  // 🔹 Atualiza campos de login
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Atualiza campos de reset
  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  // 🔹 LOGIN
  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post("/api/auth/login", formData);
    const { token, user } = response.data; 

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    onLoginSuccess(user); 

  } catch (err) {
    const msg = err.response?.data || "Erro ao logar. Verifique suas credenciais.";
    if (onShowToast) onShowToast({ message: msg, type: 'error' });
    else setAlert(msg);
  }
};
  // 🔹 RESET DE SENHA
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (resetData.novaSenha !== resetData.confirmarSenha) {
      const msg = "As senhas não coincidem.";
      if (onShowToast) onShowToast({ message: msg, type: 'error' });
      else setAlert(msg);
      return;
    }

    try {
      const res = await api.post("/api/auth/resetar-senha", {
        email: resetData.email,
        novaSenha: resetData.novaSenha,
      });

      // ✅ Exibe mensagem de sucesso
      const successMsg = res.data || "Senha redefinida com sucesso!";
      if (onShowToast) onShowToast({ message: successMsg, type: 'success' });
      else setAlert(successMsg);

      // ✅ Volta ao modo login após 2 segundos
      setTimeout(() => {
        setResetMode(false);
        setAlert("");
      }, 2000);
    } catch (err) {
      const msg = err.response?.data || "Erro ao redefinir senha.";
      if (onShowToast) onShowToast({ message: msg, type: 'error' });
      else setAlert(msg);
    }
  };

  return (
    <div className="login-container" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <h1 className="brand"><FaHandPaper /> Bem-vindo</h1>
          <p className="subtitle">
            {resetMode ? "Redefinir Senha" : "Entre na sua conta"}
          </p>
        </div>

        {alert && (
          <div
            className={`alert ${
              alert.toLowerCase().includes("sucesso") ? "success" : "error"
            }`}
          >
            {alert}
          </div>
        )}

        {!resetMode ? (
          <form className="form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
              />
            </label>
            <label>
              <span>Senha</span>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </label>

            <button type="submit" className="btn">
              <FaKey /> Entrar
            </button>

            <p
              className="link"
              onClick={() => {
                setResetMode(true);
                setAlert("");
              }}
            >
              Esqueceu sua senha?
            </p>
          </form>
        ) : (
          <form className="form" onSubmit={handleResetPassword}>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={resetData.email}
                onChange={handleResetChange}
                placeholder="Digite seu email"
                required
              />
            </label>
            <label>
              <span>Nova Senha</span>
              <input
                type="password"
                name="novaSenha"
                value={resetData.novaSenha}
                onChange={handleResetChange}
                placeholder="Nova senha"
                required
              />
            </label>
            <label>
              <span>Confirmar Senha</span>
              <input
                type="password"
                name="confirmarSenha"
                value={resetData.confirmarSenha}
                onChange={handleResetChange}
                placeholder="Confirme a senha"
                required
              />
            </label>

            <button type="submit" className="btn">
              <FaSync /> Redefinir Senha
            </button>

            <p
              className="link"
              onClick={() => {
                setResetMode(false);
                setAlert("");
              }}
            >
              Voltar ao login
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
