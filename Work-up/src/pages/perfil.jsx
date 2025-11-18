import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import "../css/perfil.css"; 
import { 
    FaPencilAlt, FaTimes, FaProjectDiagram, FaCalendarAlt, 
    FaBars, FaUser, FaChartPie, FaSignOutAlt,
    FaMapMarkerAlt
} from "react-icons/fa"; 
import api from "../service/api";
import Toast from "../components/Toast";

// --- IMPORTAÇÕES DO RECHARTS (GRÁFICOS) ---
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// --- CONSTANTES E UTILITÁRIOS ---
const LINGUAGENS_OPTIONS = [
    "JavaScript", "Python", "Java", "C#", "C++", "React", "Angular", 
    "Vue.js", "Node.js", "Spring Boot", "SQL", "MongoDB", "AWS", "Docker"
];

const parseTagsString = (tagsString) => {
    if (Array.isArray(tagsString)) return tagsString; 
    if (!tagsString || typeof tagsString !== 'string') return [];
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

// --- FUNÇÃO DE DATA BLINDADA (VERSÃO ROBUSTA) ---
const parseDate = (dateData) => {
    if (!dateData) return null;

    try {
        // 1. Se já for um array de data do Java [2025, 3, 12]
        if (Array.isArray(dateData) && dateData.length >= 3) {
            // Mês no Java array começa em 1, no JS começa em 0
            return new Date(dateData[0], dateData[1] - 1, dateData[2]);
        }

        // 2. Se for string
        if (typeof dateData === 'string') {
            const str = dateData.trim().toLowerCase();

            // Tenta formato com barras ou traços: "12/03", "12/03/2025", "2025-03-12"
            if (str.match(/\d+[\/-]\d+/)) {
                // Se for formato ISO (YYYY-MM-DD)
                if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
                    return new Date(str); 
                }
                
                // Se for formato BR (DD/MM ou DD/MM/YYYY)
                const parts = str.split(/[\/-]/); // Separa por / ou -
                if (parts.length >= 2) {
                    const dia = parseInt(parts[0]);
                    const mes = parseInt(parts[1]) - 1; // JS é 0-11
                    // Se tiver ano usa ele, senão usa o ano atual
                    const ano = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
                    return new Date(ano, mes, dia);
                }
            }

            // Tenta formato texto: "12 mar", "12 de março"
            const mesesMap = {
                'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
                'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
            };

            // Remove palavras de ligação como "de" e caracteres especiais
            const cleanStr = str.replace(/\sde\s/g, ' ').replace(/[^a-z0-9 ]/g, '');
            const parts = cleanStr.split(/\s+/);

            let dia = -1;
            let mesIndex = -1;

            // Procura por número (dia) e texto (mês)
            parts.forEach(part => {
                if (!isNaN(part)) {
                    dia = parseInt(part);
                } else {
                    // Tenta achar o mês pelo início do nome (ex: "mar" acha "março")
                    for (const key in mesesMap) {
                        if (part.startsWith(key)) {
                            mesIndex = mesesMap[key];
                            break;
                        }
                    }
                }
            });

            if (dia > 0 && mesIndex > -1) {
                const anoAtual = new Date().getFullYear();
                return new Date(anoAtual, mesIndex, dia);
            }
        }

        // Última tentativa: Date nativo (para strings ISO completas)
        let nativeDate = new Date(dateData);
        if (!isNaN(nativeDate.getTime())) return nativeDate;

        return null;
    } catch (e) {
        console.error("Erro parseDate:", e);
        return null;
    }
}

// --- COMPONENTE PRINCIPAL ---
export default function Perfil() {
  const [usuario, setUsuario] = useState(null);
  const [editando, setEditando] = useState(false);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [tagsInput, setTagsInput] = useState([]); 
  const [originalUsuario, setOriginalUsuario] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toast, setToast] = useState(null); 
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("perfil"); 

  const fetchPerfil = async () => {
    try {
      const token = localStorage.getItem("token");
      if(!token) return;

      const res = await api.get("/api/usuario/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;

      // Buscar Projetos (Se for empresa)
      if (data.role === "ROLE_EMPRESA") {
          try {
              const projetosRes = await api.get("/api/projetos/meus", {
                  headers: { Authorization: `Bearer ${token}` },
              });
              if (data.empresa) data.empresa.projetos = projetosRes.data || [];
          } catch (e) { console.error("Erro projetos", e); }
      }

      // Buscar Eventos (Aluno ou Empresa)
      try {
          let urlEventos = "";
          if (data.role === "ROLE_ALUNO") urlEventos = "/api/eventos/minhas-inscricoes";
          else if (data.role === "ROLE_EMPRESA") urlEventos = "/api/eventos";

          if (urlEventos) {
              const eventosRes = await api.get(urlEventos, {
                  headers: { Authorization: `Bearer ${token}` },
              });
              if (data.role === "ROLE_ALUNO" && data.aluno) data.aluno.eventos = eventosRes.data || [];
              else if (data.role === "ROLE_EMPRESA" && data.empresa) data.empresa.eventos = eventosRes.data || [];
          }
      } catch (e) { console.error("Erro eventos", e); }

      setUsuario(data);
      setOriginalUsuario(data); 
      
      if (data.role === "ROLE_ALUNO" && data.aluno?.tags) {
          setTagsInput(parseTagsString(data.aluno.tags));
      } else {
          setTagsInput([]);
      }
    } catch (err) {
      console.error("Erro perfil:", err);
      setToast({ message: "Erro ao carregar perfil.", type: "error" });
    }
  };

  useEffect(() => {
    fetchPerfil();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "dashboard") {
        setActiveTab("dashboard");
    }
  }, [location]);

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
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      let usuarioParaSalvar = { ...usuario };
      
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        const response = await api.post('/api/usuario/me/foto', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        if (usuarioParaSalvar.role === "ROLE_ALUNO") usuarioParaSalvar.aluno.fotoUrl = response.data.url;
        else if (usuarioParaSalvar.role === "ROLE_EMPRESA") usuarioParaSalvar.empresa.fotoUrl = response.data.url;
      }

      let payload = usuarioParaSalvar.role === "ROLE_ALUNO" ? usuarioParaSalvar.aluno : usuarioParaSalvar.empresa;
      const res = await api.put("/api/usuario/me", payload, { headers: { Authorization: `Bearer ${token}` } });
      
      const updatedUser = { ...usuario, ...res.data }; 
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setToast({ message: "Perfil salvo com sucesso!", type: "success" });
      fetchPerfil(); 
      setEditando(false);
    } catch (err) {
      setToast({ message: "Erro ao salvar.", type: "error" });
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagemPreview(URL.createObjectURL(file));
    }
  };

  if (!usuario) return <div className="loading-container"><p>Carregando perfil...</p></div>;

  const isAluno = usuario.role === "ROLE_ALUNO";

  return (
    <div className="profile-layout">
      
      <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-nav">
            <button className={`nav-item ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}>
                <FaUser className="nav-icon" /> <span>Meus Dados</span>
            </button>
            <button className={`nav-item ${activeTab === 'projetos' ? 'active' : ''}`} onClick={() => setActiveTab('projetos')}>
                <FaProjectDiagram className="nav-icon" /> <span>Projetos</span>
            </button>
            <button className={`nav-item ${activeTab === 'eventos' ? 'active' : ''}`} onClick={() => setActiveTab('eventos')}>
                <FaCalendarAlt className="nav-icon" /> <span>Eventos</span>
            </button>
            <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <FaChartPie className="nav-icon" /> <span>Dashboard</span>
            </button>
            
            <div style={{marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '10px'}}>
                 <button className="nav-item" onClick={() => {
                     localStorage.removeItem("user");
                     localStorage.removeItem("token");
                     window.location.href = "/";
                 }}>
                    <FaSignOutAlt className="nav-icon" /> <span>Sair</span>
                </button>
            </div>
        </div>
      </aside>

      <main className="profile-content">
        <button className="menu-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}><FaBars /></button>

        {/* --- ABA: PERFIL --- */}
        {activeTab === 'perfil' && (
            <div className="tab-content">
                <h2 className="perfil-titulo">{isAluno ? "Meu Perfil" : "Perfil da Empresa"}</h2>
                <div className="perfil-top" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    <div className="foto-container">
                        <img src={imagemPreview || (isAluno ? usuario.aluno?.fotoUrl : usuario.empresa?.fotoUrl) || "/default-avatar.png"} alt="Foto" className="foto-perfil"/>
                        {editando && (<label htmlFor="input-foto" className="editar-foto"><FaPencilAlt size={14} /></label>)}
                        <input id="input-foto" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} disabled={!editando} />
                    </div>

                    <div className="perfil-info" style={{ flex: 1, minWidth: '300px' }}>
                        <CampoEditavel label="Email" name="email" value={usuario.email} readOnly={true} editando={false} />
                        {isAluno ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <CampoEditavel label="Nome" name="nome" value={usuario.aluno?.nome || ""} onChange={handleChange} editando={editando} />
                                <CampoEditavel label="Matrícula" name="matricula" value={usuario.aluno?.matricula || ""} onChange={handleChange} editando={editando} />
                            </div>
                            <CampoEditavel label="Curso" name="curso" value={usuario.aluno?.curso || ""} onChange={handleChange} editando={editando} />
                            <CampoEditavel label="Descrição" name="descricao" value={usuario.aluno?.descricao || ""} onChange={handleChange} editando={editando} isTextarea={true} />
                            <TagsEditaveis label="Habilidades" tags={parseTagsString(usuario.aluno?.tags)} editando={editando} currentSelectedTags={tagsInput} handleTagChange={handleTagChange} />
                        </>
                        ) : (
                        <>
                            <CampoEditavel label="Nome Empresa" name="nome" value={usuario.empresa?.nome || ""} onChange={handleChange} editando={editando} />
                            <CampoEditavel label="CNPJ" name="cnpj" value={usuario.empresa?.cnpj || ""} onChange={handleChange} editando={editando} />
                        </>
                        )}

                        <div className="botoes" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        {!editando ? (
                            <button className="btn-principal" onClick={() => setEditando(true)}> Editar Dados</button>
                        ) : (
                            <>
                            <button className="btn-cancelar" onClick={handleCancel}>Cancelar</button>
                            <button className="btn-principal btn-salvar" onClick={handleSave}>Salvar</button>
                            </>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- ABA: PROJETOS --- */}
        {activeTab === 'projetos' && (
            <div className="tab-content">
                 <h2 className="perfil-titulo"><FaProjectDiagram /> Projetos</h2>
                 <ProjetosParticipados projetos={isAluno ? (usuario.aluno?.projetosParticipados || []) : (usuario.empresa?.projetos || [])} />
            </div>
        )}

        {/* --- ABA: EVENTOS --- */}
        {activeTab === 'eventos' && (
            <div className="tab-content">
                <h2 className="perfil-titulo"><FaCalendarAlt /> Eventos</h2>
                <EventosParticipados eventos={isAluno ? (usuario.aluno?.eventos || []) : (usuario.empresa?.eventos || [])} />
            </div>
        )}

        {/* --- ABA: DASHBOARD (COM GRÁFICOS) --- */}
        {activeTab === 'dashboard' && (
            <div className="tab-content">
                <h2 className="perfil-titulo"><FaChartPie /> Dashboard Analytics</h2>
                
                {/* CARDS DE RESUMO */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px', marginBottom: '30px' }}>
                    <div className="card-dashboard" style={{ padding: '20px', background: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #3298EF' }}>
                        <h3 style={{fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px'}}>Total Projetos</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: '10px 0 0 0' }}>
                            {isAluno ? (usuario.aluno?.projetosParticipados?.length || 0) : (usuario.empresa?.projetos?.length || 0)}
                        </p>
                    </div>
                    <div className="card-dashboard" style={{ padding: '20px', background: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #10b981' }}>
                        <h3 style={{fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px'}}>Total Eventos</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: '10px 0 0 0' }}>
                            {isAluno ? (usuario.aluno?.eventos?.length || 0) : (usuario.empresa?.eventos?.length || 0)}
                        </p>
                    </div>
                </div>

                {/* COMPONENTE DE GRÁFICOS RECHARTS */}
                <DashboardGraficos 
                    projetos={isAluno ? usuario.aluno?.projetosParticipados : usuario.empresa?.projetos}
                    eventos={isAluno ? usuario.aluno?.eventos : usuario.empresa?.eventos}
                />
            </div>
        )}

      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// --- SUB-COMPONENTES ---

function CampoEditavel({ label, name, value, onChange, editando, readOnly, isTextarea }) {
  const isEditable = !readOnly && editando;
  const InputComponent = isTextarea ? 'textarea' : 'input';
  return (
    <div className="campo">
      <label>{label}</label>
      <div className={`input-editavel ${isEditable ? 'is-editable' : ''} ${isTextarea ? 'is-textarea' : ''}`}>
        <InputComponent name={name} value={value} onChange={onChange} readOnly={readOnly || !editando} rows={isTextarea ? 4 : undefined} />
      </div>
    </div>
  );
}

function TagsEditaveis({ label, tags, editando, currentSelectedTags, handleTagChange }) {
    const generateTagClassName = (tag) => {
        if (!tag) return "";
        return `tag-${tag.replace(/[\s+#.]/g, '-').toLowerCase()}`;
    }
    const handleCheckboxChange = (e) => {
        const value = e.target.value;
        const isChecked = e.target.checked;
        let newTagsArray = isChecked ? [...currentSelectedTags, value] : currentSelectedTags.filter(tag => tag !== value);
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
                                <input type="checkbox" value={lang} checked={currentSelectedTags.includes(lang)} onChange={handleCheckboxChange} />
                                <span className={`tag-chip ${generateTagClassName(lang)}`}>{lang}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="tags-container">
                    {tags && tags.length > 0 ? tags.map(tag => <span key={tag} className={`tag-chip ${generateTagClassName(tag)}`}>{tag}</span>) : <span className="no-tags">Nenhuma.</span>}
                </div>
            )}
        </div>
    );
}

function ProjetosParticipados({ projetos }) {
    return (
        <div className="projetos-participados-section">
            <div className="projetos-grid">
                {projetos && projetos.length > 0 ? ( 
                    projetos.map(p => (
                        <div key={p.id} className="project-card">
                            <div className="project-header">
                                <h4 className="card-title">{p.nome}</h4>
                                <span className="status-regime">{p.regime || 'N/I'}</span>
                            </div>
                            <p className="card-description">{p.descricao?.substring(0, 100) || '...'}</p>
                            <div className="card-details">
                                <p><FaCalendarAlt /> {p.dataInicio ? parseDate(p.dataInicio).toLocaleDateString('pt-BR') : 'N/I'}</p>
                            </div>
                        </div>
                    ))
                ) : <p className="no-projects">Nenhum projeto.</p>}
            </div>
        </div>
    );
}

function EventosParticipados({ eventos }) {
    return (
        <div className="projetos-participados-section">
            <div className="projetos-grid">
                {eventos && eventos.length > 0 ? ( 
                    eventos.map(ev => (
                        <div key={ev.id} className="project-card">
                            <h4 className="card-title">{ev.title}</h4>
                            <p className="card-description">{ev.description?.substring(0, 100)}...</p>
                            <div className="card-details">
                                <p><FaCalendarAlt /> {ev.date}</p>
                                <p><FaMapMarkerAlt /> {ev.location}</p>
                            </div>
                        </div>
                    ))
                ) : <p className="no-projects">Nenhum evento.</p>}
            </div>
        </div>
    );
}

// --- NOVO COMPONENTE DE GRÁFICOS (Sincronizado) ---
function DashboardGraficos({ projetos, eventos }) {
    
    // 1. Processar dados para o gráfico de BARRAS (Ano Atual Completo)
    const dadosBarra = useMemo(() => {
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const anoAtual = new Date().getFullYear();
        const resultado = [];

        // Criar estrutura para Jan-Dez do ano atual
        for (let i = 0; i < 12; i++) {
            resultado.push({
                name: meses[i],
                mesIndex: i,
                ano: anoAtual,
                Projetos: 0,
                Eventos: 0
            });
        }

        // Preencher Contagem de Projetos
        (projetos || []).forEach(p => {
            const data = parseDate(p.dataInicio);
            if (data) {
                if (data.getFullYear() === anoAtual) {
                     const item = resultado.find(r => r.mesIndex === data.getMonth());
                     if (item) item.Projetos++;
                }
            }
        });

        // Preencher Contagem de Eventos
        (eventos || []).forEach(ev => {
            // Log para debug se necessário: console.log("Processando evento:", ev.title, ev.date);
            const data = parseDate(ev.date);
            if (data) {
                // Como parseDate "12 Mar" retorna o ano atual, isso vai contar
                if (data.getFullYear() === anoAtual) {
                     const item = resultado.find(r => r.mesIndex === data.getMonth());
                     if (item) item.Eventos++;
                }
            }
        });

        return resultado;
    }, [projetos, eventos]);

    // 2. Processar dados para o gráfico de PIZZA
    const dadosPizza = useMemo(() => {
        return [
            { name: 'Projetos', value: projetos?.length || 0 },
            { name: 'Eventos', value: eventos?.length || 0 },
        ].filter(item => item.value > 0);
    }, [projetos, eventos]);

    const COLORS_PIE = ['#3298EF', '#10b981'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Gráfico 1: Atividade do Ano */}
            <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '20px', color: '#444' }}>Atividade em {new Date().getFullYear()}</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={dadosBarra}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                                cursor={{ fill: '#f3f4f6' }}
                            />
                            <Legend iconType="circle" />
                            <Bar dataKey="Projetos" fill="#3298EF" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="Eventos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfico 2: Pizza */}
            {(projetos?.length > 0 || eventos?.length > 0) && (
                <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px', color: '#444' }}>Distribuição de Participação</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={dadosPizza}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dadosPizza.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}