import { useEffect, useState } from "react";
import "../css/CadastroCard.css";
import api from '../service/api';
import { FaGraduationCap, FaBuilding, FaEdit, FaCheck } from "react-icons/fa";

// Componente de alerta
function Alert({ message, type = "success", onClose }) {
  return (
    <div
      className={`alert ${type === "success" ? "success" : "error"}`}
      role="alert"
    >
      <div className="flex-1">{message}</div>
      {onClose && (
        <button onClick={onClose} className="close-btn">
          ✕
        </button>
      )}
    </div>
  );
}

export default function CadastroCard({ onClose }) {
  const [tipo, setTipo] = useState("ALUNO");

  // Estado único para todos os campos
  const [formData, setFormData] = useState({
    nome: "",
    curso: "",
    matricula: "",
    cnpj: "",
    email: "",
    telefone: "",
    senha: "",
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    setFormData({
      nome: "",
      curso: "",
      matricula: "",
      cnpj: "",
      email: "",
      telefone: "",
      senha: "",
    });
  }, [tipo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Função de validação de e-mail
  const isValidEmail = (email) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|hotmail\.com|yahoo\.com|icloud\.com|live\.com)$/i;
    return pattern.test(email);
  };

  const handleSubmit = async () => {
    // 🔹 Valida o e-mail antes de prosseguir
    if (!isValidEmail(formData.email)) {
      setAlertMessage("Por favor, insira um e-mail válido (gmail, outlook, hotmail, yahoo, etc).");
      setShowAlert(true);
      return;
    }

    try {
      const payload =
        tipo === "ALUNO"
          ? {
              nome: formData.nome,
              curso: formData.curso,
              matricula: formData.matricula,
              email: formData.email,
              senha: formData.senha,
              role: "ROLE_ALUNO",
            }
          : {
              nome: formData.nome,
              cnpj: formData.cnpj,
              email: formData.email,
              telefone: formData.telefone,
              senha: formData.senha,
              role: "ROLE_EMPRESA",
            };

      await api.post("/api/auth/register", payload);
      setAlertMessage("Cadastro realizado com sucesso!");
      setShowAlert(true);

      // Limpa os campos após o cadastro
      setFormData({
        nome: "",
        curso: "",
        matricula: "",
        cnpj: "",
        email: "",
        telefone: "",
        senha: "",
      });
    } catch (error) {
      console.error(error);
      setAlertMessage(
        error.response?.data ||
          "Erro ao cadastrar. Verifique os dados e tente novamente."
      );
      setShowAlert(true);
    }
  };

  return (
    <div className="card-container" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h1><FaEdit /> Faça o seu cadastro</h1>

        {/* Alerta */}
        {showAlert && (
          <Alert
            message={alertMessage}
            type={alertMessage.includes("sucesso") ? "success" : "error"}
            onClose={() => setShowAlert(false)}
          />
        )}

        {/* Tabs */}
        <div className="tab-buttons">
          <button
            onClick={() => setTipo("ALUNO")}
            className={tipo === "ALUNO" ? "active-tab" : ""}
          >
            <span className="tab-icon"><FaGraduationCap /></span>
            Aluno
          </button>
          <button
            onClick={() => setTipo("EMPRESA")}
            className={tipo === "EMPRESA" ? "active-tab" : ""}
          >
            <span className="tab-icon"><FaBuilding /></span>
            Empresa
          </button>
        </div>

        {/* Formulário */}
        <div className="form-fields">
          {tipo === "ALUNO" ? (
            <>
              <div className="form-row">
                <label>
                  Nome:*
                  <input
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    type="text"
                    placeholder="Digite seu nome"
                  />
                </label>
                <label>
                  Curso:*
                  <input
                    name="curso"
                    value={formData.curso}
                    onChange={handleChange}
                    type="text"
                    placeholder="Digite seu curso"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Matrícula:*
                  <input
                    name="matricula"
                    value={formData.matricula}
                    onChange={handleChange}
                    type="text"
                    placeholder="Digite sua matrícula"
                  />
                </label>
                <label>
                  E-mail:*
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Digite seu e-mail"
                  />
                </label>
              </div>
              <div className="form-row-full">
                <label>
                  Senha:*
                  <input
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    type="password"
                    placeholder="Digite sua senha"
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <label>
                  Nome da Empresa:*
                  <input
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    type="text"
                    placeholder="Digite o nome da empresa"
                  />
                </label>
                <label>
                  CNPJ:*
                  <input
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    type="text"
                    placeholder="Digite o CNPJ"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Telefone:*
                  <input
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    type="tel"
                    placeholder="Digite o telefone"
                  />
                </label>
                <label>
                  Email:*
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Digite o email"
                  />
                </label>
              </div>
              <div className="form-row-full">
                <label>
                  Senha:*
                  <input
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    type="password"
                    placeholder="Digite sua senha"
                  />
                </label>
              </div>
            </>
          )}
        </div>

        {/* Botão de envio */}
        <button onClick={handleSubmit} className="submit-btn">
          <FaCheck /> Finalizar Cadastro
        </button>
      </div>
    </div>
  );
}
