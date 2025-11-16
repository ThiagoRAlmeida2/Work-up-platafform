import React, { useState, useEffect } from "react";
import "../css/perfil.css";
import { FaPencilAlt, FaTimes, FaProjectDiagram, FaCalendarAlt, FaFlag, FaBriefcase } from "react-icons/fa"; 
import api from "../service/api";
import Toast from "../components/Toast";

const LINGUAGENS_OPTIONS = [
    "JavaScript", "Python", "Java", "C#", "C++", "React", "Angular", 
    "Vue.js", "Node.js", "Spring Boot", "SQL", "MongoDB", "AWS", "Docker"
];

const parseTagsString = (tagsString) => {
    if (!tagsString || typeof tagsString !== 'string') return [];
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

const parseDate = (dateData) => {
    if (!dateData) return null;
    
    if (Array.isArray(dateData) && dateData.length >= 3) {
      const date = new Date(dateData[0], dateData[1] - 1, dateData[2]);
      if (isNaN(date)) return null;
      return date;
    }
    
    const date = new Date(dateData);
    if (isNaN(date)) return null;
    return date;
}

export default function Perfil() {
  const [usuario, setUsuario] = useState(null);
  const [editando, setEditando] = useState(false);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [tagsInput, setTagsInput] = useState([]); 
  const [originalUsuario, setOriginalUsuario] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toast, setToast] = useState(null); 

  const fetchPerfil = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/api/usuario/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setUsuario(data);
      setOriginalUsuario(data); 
      
      if (data.role === "ROLE_ALUNO" && data.aluno?.tags) {
          setTagsInput(parseTagsString(data.aluno.tags));
      } else {
          setTagsInput([]);
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    }
  };

  useEffect(() => {
    fetchPerfil();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsuario((prev) => ({
      ...prev,
      aluno: prev.aluno ? { ...prev.aluno, [name]: value } : prev.aluno,
      empresa: prev.empresa ? { ...prev.empresa, [name]: value } : prev.empresa,
    }));
  };
  
  const handleTagChange = (newTagsArray) => {
    setTagsInput(newTagsArray); 
    setUsuario((prev) => ({
        ...prev,
        aluno: prev.aluno ? { ...prev.aluno, tags: newTagsArray.join(',') } : prev.aluno,
    }));
  };
  
  const handleCancel = () => {
    setUsuario(originalUsuario);
    if (originalUsuario.role === "ROLE_ALUNO" && originalUsuario.aluno?.tags) {
        setTagsInput(parseTagsString(originalUsuario.aluno.tags));
    }
    setEditando(false);
    setImagemPreview(null);
    setSelectedImage(null);
    fetchPerfil(); 
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      let usuarioParaSalvar = { ...usuario };
      if (selectedImage) {
        
        const formData = new FormData();
        formData.append('file', selectedImage);
        
        const response = await api.post('/api/usuario/me/foto', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        const novaFotoUrl = response.data.url;

        if (usuarioParaSalvar.role === "ROLE_ALUNO") {
          usuarioParaSalvar.aluno.fotoUrl = novaFotoUrl;
        } else if (usuarioParaSalvar.role === "ROLE_EMPRESA") {
          usuarioParaSalvar.empresa.fotoUrl = novaFotoUrl;
        }
      }

      let payload;
      if (usuarioParaSalvar.role === "ROLE_ALUNO") {
          payload = usuarioParaSalvar.aluno; 
      } else {
          payload = usuarioParaSalvar.empresa;
      }
      
      const res = await api.put(
        "/api/usuario/me",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const usuarioAtualizado = res.data; 
      localStorage.setItem("user", JSON.stringify(usuarioAtualizado));

      setToast({
        message: "Perfil atualizado com sucesso! Recarregando...",
        type: "success"
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err)      {
      console.error("Erro ao atualizar perfil:", err);
      setToast({
        message: err.response?.data?.message || err.response?.data || "Erro ao salvar alterações",
        type: "error"
      });
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagemPreview(URL.createObjectURL(file));
    }
  };

  if (!usuario) return <p className="loading">Carregando perfil...</p>;

  const isAluno = usuario.role === "ROLE_ALUNO";
  const alunoTags = parseTagsString(usuario.aluno?.tags); 

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <h2 className="perfil-titulo">
          {isAluno ? "Meu Perfil de Aluno" : "Perfil da Empresa"}
        </h2>
        
        <div className="perfil-top">
          
          <div className="foto-container">
            <img
              src={imagemPreview || (isAluno ? usuario.aluno?.fotoUrl : usuario.empresa?.fotoUrl) || "/default-avatar.png"}
              alt="Foto de perfil"
              className="foto-perfil"
            />
            
            {editando && (
                <label htmlFor="input-foto" className="editar-foto">
                  <FaPencilAlt size={16} />
                </label>
            )}

            <input
              id="input-foto"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              disabled={!editando} 
            />
          </div>

          <div className="perfil-info">
            <CampoEditavel
              label="Email"
              name="email"
              value={usuario.email}
              readOnly={true}
              editando={false}
            />

            {isAluno ? (
              <>
                <CampoEditavel
                  label="Nome"
                  name="nome"
                  value={usuario.aluno?.nome || ""}
                  onChange={handleChange}
                  editando={editando}
                  key={`aluno-nome-${editando}`} 
                />
                <CampoEditavel
                  label="Curso"
                  name="curso"
                  value={usuario.aluno?.curso || ""}
                  onChange={handleChange}
                  editando={editando}
                  key={`aluno-curso-${editando}`}
                />
                <CampoEditavel
                  label="Matrícula"
                  name="matricula"
                  value={usuario.aluno?.matricula || ""}
                  onChange={handleChange}
                  editando={editando}
                  key={`aluno-matricula-${editando}`}
                />
                <CampoEditavel
                  label="Descrição Pessoal"
                  name="descricao"
                  value={usuario.aluno?.descricao || ""}
                  onChange={handleChange}
                  editando={editando}
                  key={`aluno-descricao-${editando}`}
                  isTextarea={true}
                />
                <TagsEditaveis
                    label="Habilidades/Tecnologias"
                    tags={alunoTags}
                    editando={editando}
                    currentSelectedTags={tagsInput}
                    handleTagChange={handleTagChange}
                />
              </>
            ) : (
              <>
                <CampoEditavel
                  label="Nome da Empresa"
                  name="nome"
                  value={usuario.empresa?.nome || ""}
                  onChange={handleChange}
                  editando={editando}
                  key={`empresa-nome-${editando}`}
                />
                <CampoEditavel
                  label="CNPJ"
                  name="cnpj"
                  value={usuario.empresa?.cnpj || ""}
                  onChange={handleChange}
                  editando={editando}
                  key={`empresa-cnpj-${editando}`}
                />
              </>
            )}

            <div className="botoes">
              {!editando ? (
                <button className="btn-principal" onClick={() => setEditando(true)}>
                  <FaPencilAlt size={14} style={{marginRight: '8px'}} />
                  Editar Perfil
                </button>
              ) : (
                <>
                  <button className="btn-cancelar" onClick={handleCancel}>
                    <FaTimes size={14} style={{marginRight: '8px'}} />
                    Cancelar
                  </button>
                  <button className="btn-principal btn-salvar" onClick={handleSave}>
                    Salvar Alterações
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {isAluno && (
          <ProjetosParticipados 
              projetos={usuario.aluno?.projetosParticipados || []} 
          />
        )}
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function CampoEditavel({ label, name, value, onChange, editando, readOnly, isTextarea }) {
  const isEditable = !readOnly && editando;
  const InputComponent = isTextarea ? 'textarea' : 'input';
  return (
    <div className="campo">
      <label>{label}</label>
      <div className={`input-editavel ${isEditable ? 'is-editable' : ''} ${isTextarea ? 'is-textarea' : ''}`}>
        <InputComponent
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly || !editando}
          rows={isTextarea ? 4 : undefined}
        />
        {!readOnly && <FaPencilAlt className={`icone-editar ${isEditable ? 'visible' : ''}`} />}
      </div>
    </div>
  );
}

function TagsEditaveis({ label, tags, editando, currentSelectedTags, handleTagChange }) {

    const generateTagClassName = (tag) => {
        if (tag === "C++") return "tag-c-plus-plus"; 
        
        return `tag-${tag
            .replace(/\s/g, '-')
            .replace(/\+\+/g, 'plus-plus')
            .replace(/\#/g, 'sharp')
            .replace(/\./g, '-')
            .toLowerCase()
        }`;
    }

    const handleCheckboxChange = (e) => {
        const value = e.target.value;
        const isChecked = e.target.checked;
        let newTagsArray;
        if (isChecked) {
            newTagsArray = [...currentSelectedTags, value];
        } else {
            newTagsArray = currentSelectedTags.filter(tag => tag !== value);
        }
        handleTagChange(newTagsArray);
    };
    
    return (
        <div className="campo">
            <label>{label}</label>
            {editando ? (
                <div className="form-group-tags">
                    <div className="tag-checkbox-group">
                        {LINGUAGENS_OPTIONS.map(lang => (
                            <label key={lang} className="tag-checkbox-label">
                                <input
                                    type="checkbox"
                                    value={lang}
                                    checked={currentSelectedTags.includes(lang)}
                                    onChange={handleCheckboxChange}
                                />
                                <span className={`tag-chip ${generateTagClassName(lang)}`}>
                                    {lang}
                                </span>
                            </label>
                        ))}
                    </div>
                    <small>Selecione suas principais tecnologias.</small>
                </div>

            ) : (
                <div className="tags-container">
                    {tags.length > 0 ? (
                        tags.map(tag => (
                            <span key={tag} className="tag-chip">
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="no-tags">Nenhuma tecnologia listada.</span>
                    )}
                </div>
            )}
        </div>
    );
}


function ProjetosParticipados({ projetos }) {
    return (
        <div className="projetos-participados-section">
            <h3><FaProjectDiagram /> Projetos Participados ({projetos.length})</h3>
            <div className="projetos-grid">
                {projetos.length > 0 ? ( 
                    projetos.map(p => (
                        <div key={p.id} className="project-card projeto-participado">
                            <div className="project-header">
                                <h4 className="card-title">{p.nome}</h4>
                            </div>
                            <div className="project-body">
                                <p className="card-description">{p.descricao?.substring(0, 100) || 'Sem descrição.'}...</p>
                                <div className="tags-list">
                                    {parseTagsString(p.tags).length > 0 ? (
                                        parseTagsString(p.tags).map(tag => (
                                            <span key={tag} className="tag-chip">
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="no-tags">Sem tags</span>
                                    )}
                                </div>
                                <div className="card-details">
                                    <p className="card-info"><FaCalendarAlt /> Início: <span>{p.dataInicio ? parseDate(p.dataInicio).toLocaleDateString('pt-BR') : 'N/I'}</span></p>
                                    <p className="card-info"><FaFlag /> Fim (Previsto): <span>{p.dataFim ? parseDate(p.dataFim).toLocaleDateString('pt-BR') : 'N/I'}</span></p>
                                    <p className="card-info"><FaBriefcase /> Regime: <span className={`status-regime regime-${p.regime?.toLowerCase()}`}>{p.regime || 'N/I'}</span></p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-projects">Ainda não há projetos registrados.</p>
                )}
            </div>
        </div>
    );
}