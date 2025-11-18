import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import "../css/perfil.css"; 
import { 
    FaPencilAlt, FaTimes, FaProjectDiagram, FaCalendarAlt, 
    FaBars, FaUser, FaChartPie, FaSignOutAlt,
    FaMapMarkerAlt, FaRocket, FaBullseye, FaMedal, 
    FaClock, FaUsers, FaStar, FaBolt, FaArrowUp, FaChartLine, FaExternalLinkAlt, FaChartArea
} from "react-icons/fa"; 
import api from "../service/api";
import Toast from "../components/Toast";

import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

const LINGUAGENS_OPTIONS = [
    "JavaScript", "Python", "Java", "C#", "C++", "React", "Angular", 
    "Vue.js", "Node.js", "Spring Boot", "SQL", "MongoDB", "AWS", "Docker"
];

const COLORS = ['#3298EF', '#312e81', '#1e1b4b', '#0078D1', '#111827', '#6366f1', '#8b5cf6', '#06b6d4'];

const parseTagsString = (tagsString) => {
    if (Array.isArray(tagsString)) return tagsString; 
    if (!tagsString || typeof tagsString !== 'string') return [];
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

const parseDate = (dateData) => {
    if (!dateData) return null;
    try {
        if (Array.isArray(dateData) && dateData.length >= 3) {
            return new Date(dateData[0], dateData[1] - 1, dateData[2]);
        }
        if (typeof dateData === 'string') {
            const str = dateData.trim().toLowerCase();
            if (str.match(/\d+[\/-]\d+/)) {
                 let date = new Date(dateData);
                 if (!isNaN(date.getTime())) return date;
            }
            const mesesMap = {'jan':0,'fev':1,'mar':2,'abr':3,'mai':4,'jun':5,'jul':6,'ago':7,'set':8,'out':9,'nov':10,'dez':11};
            const cleanStr = str.replace(/[^a-z0-9 ]/g, '');
            const parts = cleanStr.split(/\s+/);
            let dia = -1, mesIndex = -1;
            parts.forEach(p => {
                if(!isNaN(p)) dia = parseInt(p);
                else Object.keys(mesesMap).forEach(m => { if(p.startsWith(m)) mesIndex = mesesMap[m] });
            });
            if(dia > 0 && mesIndex > -1) return new Date(new Date().getFullYear(), mesIndex, dia);
        }
        let d = new Date(dateData);
        return isNaN(d.getTime()) ? null : d;
    } catch (e) { return null; }
}

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "evolucao") {
        setActiveTab("evolucao");
    } else if (tab === "projetos") {
        setActiveTab("projetos");
    } else if (tab === "perfil") {
        setActiveTab("perfil");
    }
  }, [location]);

  const fetchPerfil = async () => {
    try {
      const token = localStorage.getItem("token");
      if(!token) return;

      const res = await api.get("/api/usuario/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = res.data;

      data.dataCadastro = data.dataCadastro || data.createdAt; 

      if (data.role === "ROLE_EMPRESA") {
          try {
              const projetosRes = await api.get("/api/projetos/meus", {
                  headers: { Authorization: `Bearer ${token}` },
              });
              if (data.empresa) data.empresa.projetos = projetosRes.data || [];
          } catch (e) { console.error("Erro projetos", e); }
      }

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
            <button className={`nav-item ${activeTab === 'evolucao' ? 'active' : ''}`} onClick={() => setActiveTab('evolucao')}>
                <FaChartPie className="nav-icon" /> <span>Evolução</span>
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

        {activeTab === 'projetos' && (
            <div className="tab-content">
                 <h2 className="perfil-titulo"><FaProjectDiagram /> Projetos</h2>
                 <ProjetosParticipados projetos={isAluno ? (usuario.aluno?.projetosParticipados || []) : (usuario.empresa?.projetos || [])} />
            </div>
        )}

        {activeTab === 'eventos' && (
            <div className="tab-content">
                <h2 className="perfil-titulo"><FaCalendarAlt /> Eventos</h2>
                <EventosParticipados eventos={isAluno ? (usuario.aluno?.eventos || []) : (usuario.empresa?.eventos || [])} />
            </div>
        )}

        {activeTab === 'evolucao' && (
            <DashboardEvolucao usuario={usuario} isAluno={isAluno} />
        )}

      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
        <InputComponent name={name} value={value} onChange={onChange} readOnly={readOnly || !editando} rows={isTextarea ? 4 : undefined} />
      </div>
    </div>
  );
}

function TagsEditaveis({ label, tags, editando, currentSelectedTags, handleTagChange }) {
    
    // NOVO: Função para gerar nomes de classes CSS limpos e compatíveis
    const generateTagClassName = (tag) => {
        if (!tag) return "";
        let cleanTag = tag.toLowerCase().trim();

        // Mapeamento explícito para tags com caracteres especiais
        if (cleanTag === 'c++') return 'tag-c-plus-plus';
        if (cleanTag === 'c#') return 'tag-csharp';
        if (cleanTag === 'vue.js') return 'tag-vue-js';
        if (cleanTag === 'node.js') return 'tag-node-js';
        if (cleanTag === 'spring boot') return 'tag-spring-boot';

        // Padrão para os demais
        return `tag-${cleanTag.replace(/[\s.#]/g, '-')}`;
    };
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
function DashboardEvolucao({ usuario, isAluno }) {
    const navigate = useNavigate();
    const [realData, setRealData] = useState(null);

    useEffect(() => {
        if (!usuario) return;
        
        const projetos = isAluno ? (usuario.aluno?.projetosParticipados || []) : (usuario.empresa?.projetos || []);
        const eventos = isAluno ? (usuario.aluno?.eventos || []) : (usuario.empresa?.eventos || []);
        const tags = isAluno ? parseTagsString(usuario.aluno?.tags) : [];
        
        const totalProjetos = projetos.length;
        const projetosConcluidos = projetos.filter(p => p.encerrado || p.status === 'CONCLUIDO').length;
        const totalEventos = eventos.length;
        
        let totalColaboradores = 0;
        if(!isAluno && projetos.length > 0) {
             totalColaboradores = projetos.reduce((acc, p) => acc + (p.aprovados || 0) + (p.totalCandidatos || 0), 0);
        }

        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const anoAtual = new Date().getFullYear();
        // Inicializa a estrutura para incluir eventos
        const atividadePorMes = meses.map((mes, index) => ({ mes, projetos: 0, concluidos: 0, eventos: 0 }));

        // Lógica de Projetos
        projetos.forEach(p => {
            const d = parseDate(p.dataInicio);
            if (d && d.getFullYear() === anoAtual) {
                atividadePorMes[d.getMonth()].projetos += 1;
                if(p.encerrado) atividadePorMes[d.getMonth()].concluidos += 1;
            }
        });
        
        // Lógica de Eventos (ADICIONADA)
        eventos.forEach(e => {
            // Assume que 'e.date' é o campo de data do evento e usa a função utilitária
            const d = parseDate(e.date); 
            if (d && d.getFullYear() === anoAtual) {
                // Incrementa a contagem de eventos no mês correto
                atividadePorMes[d.getMonth()].eventos += 1;
            }
        });


        setRealData({
            totalProjetos,
            projetosConcluidos,
            totalEventos,
            tecnologiasDominadas: isAluno ? tags.length : 0,
            colaboradores: totalColaboradores,
            projetosPorMes: atividadePorMes // Renomeado internamente no cálculo, mas mantém o nome do estado
        });

    }, [usuario, isAluno]);

    if (!realData) return <p>Carregando dados...</p>;

    const achievements = [
        {
          id: 'primeiro_passo', icon: <FaBullseye />, title: 'Primeiro Passo',
          description: isAluno ? 'Participou do 1º projeto' : 'Criou a 1ª vaga',
          condition: (d) => d.totalProjetos >= 1
        },
        {
          id: 'veteran', icon: <FaMedal />, title: 'Veterano',
          description: 'Mais de 5 projetos no histórico',
          condition: (d) => d.totalProjetos >= 5
        },
        {
          id: 'networker', icon: <FaUsers />, title: 'Networker',
          description: isAluno ? 'Participou de 3 eventos' : 'Criou 3 eventos',
          condition: (d) => d.totalEventos >= 3
        }
    ];

    const StatCard = ({ icon, title, value, color }) => (
        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: `${color}20`, color, padding: '12px', borderRadius: '10px', display: 'flex', fontSize: '1.5rem' }}>{icon}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '5px' }}>{title}</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{value}</div>
          </div>
        </div>
    );

    return (
        <div className="tab-content">
             <div className="evolucoes-header" style={{ marginBottom: '30px', textAlign: 'center', position: 'relative' }}>
                <h1 style={{ fontSize: '2rem', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <FaRocket style={{ color: '#3298EF' }} />
                  Evolução {isAluno ? 'Profissional' : 'Empresarial'}
                </h1>
                <p style={{ color: '#6b7280' }}>Acompanhe seu crescimento e métricas na plataforma.</p>
                
                <button 
                    className="btn-ver-detalhes-evolucao"
                    onClick={() => navigate('/evolucao')} 
                    style={{
                        marginTop: '15px',
                        padding: '10px 20px',
                        backgroundColor: '#3298EF',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 10px rgba(50, 152, 239, 0.3)'
                    }}
                >
                    <FaExternalLinkAlt size={12} />
                    Ver Análise Detalhada
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <StatCard icon={<FaBullseye />} title={isAluno ? "Projetos" : "Vagas Criadas"} value={realData.totalProjetos} color="#3298EF" />
                <StatCard icon={<FaMedal />} title={isAluno ? "Concluídos" : "Encerradas"} value={realData.projetosConcluidos} color="#10b981" />
                <StatCard icon={<FaCalendarAlt />} title={isAluno ? "Eventos" : "Eventos Criados"} value={realData.totalEventos} color="#f59e0b" />
                {isAluno ? (
                    <StatCard icon={<FaBolt />} title="Skills" value={realData.tecnologiasDominadas} color="#8b5cf6" />
                ) : (
                    <StatCard icon={<FaUsers />} title="Candidatos" value={realData.colaboradores} color="#ef4444" />
                )}
            </div>

            <div className="charts-section" style={{ marginBottom: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                
                <div style={{ background: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#374151' }}>
                        <FaCalendarAlt /> Atividade Mensal ({new Date().getFullYear()})
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={realData.projetosPorMes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="mes" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="projetos" name="Projetos Ativos" stroke="#3298EF" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="concluidos" name="Projetos Concluídos" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="eventos" name="Eventos" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} /> {/* LINHA ADICIONADA */}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                 <div style={{ background: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#374151' }}>
                        <FaChartLine /> Resumo Geral
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                            { nome: 'Projetos', valor: realData.totalProjetos },
                            { nome: 'Eventos', valor: realData.totalEventos },
                            { nome: 'Conclusões', valor: realData.projetosConcluidos }
                        ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="nome" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="valor" fill="#3298EF" radius={[4, 4, 0, 0]} barSize={50}>
                            <Cell fill="#3298EF" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#10b981" />
                        </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="achievements-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.5rem' }}>
                    <FaBolt style={{ color: '#f59e0b' }} /> Conquistas
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {achievements.map((achievement) => {
                        const isUnlocked = achievement.condition(realData);
                        return (
                            <div key={achievement.id} style={{
                                background: isUnlocked ? 'linear-gradient(135deg, #fff, #f0f9ff)' : '#f3f4f6',
                                padding: '20px',
                                borderRadius: '12px',
                                border: isUnlocked ? '2px solid #3298EF' : '1px solid #e5e7eb',
                                opacity: isUnlocked ? 1 : 0.6,
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '2rem', color: isUnlocked ? '#3298EF' : '#9ca3af', marginBottom: '10px' }}>{achievement.icon}</div>
                                <h4 style={{ color: '#1f2937', marginBottom: '5px' }}>{achievement.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>{achievement.description}</p>
                                {isUnlocked && <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#10b981', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>CONQUISTADO</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}