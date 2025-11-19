import React, { useState, useEffect } from "react";
import "../css/evolucoes.css"; 
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, Cell
} from "recharts";
import { 
    FaRocket, FaChartLine, FaBullseye, FaMedal, FaUsers, 
    FaCalendarAlt, FaArrowUp, FaBolt, FaCode
} from "react-icons/fa";
import api from "../service/api";

// --- UTILITÁRIOS ---

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
             const mesesMap = {'jan':0,'fev':1,'mar':2,'abr':3,'mai':4,'jun':5,'jul':6,'ago':7,'set':8,'out':9,'nov':10,'dez':11};
             const str = dateData.toLowerCase().replace(/[^a-z0-9 ]/g, '');
             if(str.match(/\d+[\/-]\d+/)) { let d = new Date(dateData); if(!isNaN(d)) return d; }
             
             const parts = str.split(/\s+/);
             let dia, mesIndex;
             parts.forEach(p => {
                if(!isNaN(p)) dia = parseInt(p);
                else Object.keys(mesesMap).forEach(m => { if(p.startsWith(m)) mesIndex = mesesMap[m] });
             });
             if(dia > 0 && mesIndex > -1) return new Date(new Date().getFullYear(), mesIndex, dia);
        }
        let d = new Date(dateData);
        return isNaN(d.getTime()) ? null : d;
    } catch (e) { return null; }
};

const formatRegistrationDate = (dateString) => {
    const date = parseDate(dateString);
    if (!date) return "Data Indisponível";
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const isProjectConcluded = (p) => {
    if (p.encerrado === true) return true;
    if (!p.dataFim) return false;
    const endDate = parseDate(p.dataFim);
    if (!endDate) return false;
    return endDate.getTime() < new Date().getTime();
};

const COLORS = ['#3298EF', '#312e81', '#1e1b4b', '#0078D1', '#111827', '#6366f1'];

// 🟢 NOVA FUNÇÃO DE CÁLCULO (Tags Perfil + Tags Projetos)
// Recebe uma lista bruta com todas as tags encontradas e calcula a % de frequência
const calculateStackPercentages = (allTagsList) => {
    const counts = {};
    let totalOccurrences = 0;

    // Conta quantas vezes cada tecnologia aparece no total
    allTagsList.forEach(tag => {
        const cleanTag = tag.trim();
        if (cleanTag) {
            counts[cleanTag] = (counts[cleanTag] || 0) + 1;
            totalOccurrences++;
        }
    });

    if (totalOccurrences === 0) return [];

    // Calcula a % com base no total de menções
    return Object.keys(counts).map(tag => ({
        nome: tag,
        valor: Math.round((counts[tag] / totalOccurrences) * 100)
    })).sort((a, b) => b.valor - a.valor); // Ordena da maior % para a menor
};


const mockDataInicial = {
  totalProjetos: 0,
  projetosConcluidos: 0,
  duracaoMedia: 0,
  tecnologiasDominadas: 0,
  colaboradores: 0,
  avaliacaoMedia: 0,
  totalEventos: 0, 
  projetosPorMes: [],
  tecnologias: [],
  habilidades: [],
  firstProjectDate: null, 
  firstEventDate: null, 
};

export default function Evolucao() {
  const [realData, setRealData] = useState(mockDataInicial);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [userData, setUserData] = useState({});

  // --- SISTEMA DE CONQUISTAS ---
  const achievements = [
    {
      id: 'primeiro_passo',
      icon: <FaBullseye />,
      title: 'Primeiro Passo',
      description: userRole === 'ROLE_ALUNO' ? 'Participou do 1º projeto' : 'Criou a 1ª vaga',
      condition: (data) => data.totalProjetos >= 1
    },
    {
      id: 'tech_explorer',
      icon: <FaRocket />,
      title: 'Explorador Tech',
      description: userRole === 'ROLE_ALUNO' ? 'Dominou 3+ tecnologias' : 'Vagas com 3+ stacks diferentes',
      condition: (data) => data.tecnologiasDominadas >= 3
    },
    {
      id: 'veteran',
      icon: <FaMedal />,
      title: 'Veterano',
      description: 'Mais de 5 projetos/vagas no histórico',
      condition: (data) => data.totalProjetos >= 5
    },
    {
      id: 'networker',
      icon: <FaUsers />,
      title: 'Networker',
      description: userRole === 'ROLE_ALUNO' ? 'Participou de 3 eventos' : 'Criou 3 eventos',
      condition: (data) => data.totalEventos >= 3
    }
  ];

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }

      const meRes = await api.get('/api/usuario/me', { headers: { Authorization: `Bearer ${token}` } });
      const userData = meRes.data;
      setUserData(userData);
      setUserRole(userData.role);
      setUserName(userData.aluno?.nome || userData.empresa?.nome || "Usuário");

      let projetos = [];
      let eventos = [];
      
      // Array mestre para o cálculo de porcentagem (Stack)
      let allTagsForCalculation = []; 
      
      // Set para contagem simples de tecnologias únicas (Card de Estatística)
      let uniqueTagsSet = new Set(); 

      if (userData.role === 'ROLE_ALUNO') {
          projetos = userData.aluno?.projetosParticipados || [];
          const evRes = await api.get('/api/eventos/minhas-inscricoes', { headers: { Authorization: `Bearer ${token}` } });
          eventos = evRes.data || [];
          
          // 1. Adicionar Habilidades do Perfil (Input do Aluno)
          const perfilTags = parseTagsString(userData.aluno?.tags);
          allTagsForCalculation = [...allTagsForCalculation, ...perfilTags];
          perfilTags.forEach(t => uniqueTagsSet.add(t));
          
          // 2. Adicionar Tags dos Projetos Inscritos
          projetos.forEach(p => {
              const pTags = parseTagsString(p.tags);
              allTagsForCalculation = [...allTagsForCalculation, ...pTags];
              pTags.forEach(t => uniqueTagsSet.add(t));
          });

      } else if (userData.role === 'ROLE_EMPRESA') {
          const projRes = await api.get('/api/projetos/meus', { headers: { Authorization: `Bearer ${token}` } });
          projetos = projRes.data || [];
          const evRes = await api.get('/api/eventos', { headers: { Authorization: `Bearer ${token}` } });
          eventos = evRes.data.filter(ev => ev.empresaNome === userData.empresa?.nome) || [];
          
          projetos.forEach(p => {
              const pTags = parseTagsString(p.tags);
              allTagsForCalculation = [...allTagsForCalculation, ...pTags];
              pTags.forEach(t => uniqueTagsSet.add(t));
          });
      }

      const projetosConcluidos = projetos.filter(p => isProjectConcluded(p)).length;
      
      const firstProject = projetos.length > 0
          ? projetos.map(p => parseDate(p.dataInicio)).filter(d => d).sort((a, b) => a - b)[0]
          : null;

      const firstEvent = eventos.length > 0
          ? eventos.map(e => parseDate(e.date)).filter(d => d).sort((a, b) => a - b)[0]
          : null;

      // Gráfico mensal
      const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesesMap = {};
      mesesLabels.forEach(m => mesesMap[m] = { mes: m, projetos: 0, eventos: 0, concluidos: 0 }); 

      projetos.forEach(p => {
          const d = parseDate(p.dataInicio);
          if (d && d.getFullYear() === new Date().getFullYear()) {
              mesesMap[mesesLabels[d.getMonth()]].projetos += 1;
              if (isProjectConcluded(p)) { 
                  mesesMap[mesesLabels[d.getMonth()]].concluidos += 1;
              }
          }
      });

      eventos.forEach(ev => {
          const d = parseDate(ev.date);
          if (d && d.getFullYear() === new Date().getFullYear()) {
              mesesMap[mesesLabels[d.getMonth()]].eventos += 1;
          }
      });

      const graficosData = Object.values(mesesMap);

      // 🟢 CÁLCULO DA STACK (USANDO A LISTA COMBINADA)
      const tecnologiasStack = calculateStackPercentages(allTagsForCalculation);

      const processedData = {
          totalProjetos: projetos.length,
          projetosConcluidos,
          totalEventos: eventos.length,
          duracaoMedia: projetos.length > 0 ? Math.floor(Math.random() * 5) + 1 : 0,
          tecnologiasDominadas: uniqueTagsSet.size,
          colaboradores: userData.role === 'ROLE_EMPRESA' ? projetos.reduce((acc, p) => acc + (p.totalCandidatos || 0), 0) : 0,
          avaliacaoMedia: 4.8,
          projetosPorMes: graficosData,
          tecnologias: tecnologiasStack, 
          firstProjectDate: firstProject,
          firstEventDate: firstEvent
      };

      setRealData(processedData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="loading-container"><p>Carregando Dashboard...</p></div>;
  }

  return (
    <div className="evolucoes-page">
      <div className="container">
        
        {/* HEADER COM ANIMAÇÃO FLUTUANTE */}
        <div className="evolucoes-header">
          <div className="header-content">
            <h1 className="page-title">
              <FaRocket className="title-icon" />
              Evolução {userRole === 'ROLE_ALUNO' ? 'Profissional' : 'Empresarial'}
            </h1>
            <p className="page-subtitle">
              Olá, <strong>{userName}</strong>. Acompanhe suas métricas e conquistas na plataforma.
            </p>
          </div>
          <div className="header-decoration">
            <div className="floating-elements">
              <div className="floating-circle"></div>
              <div className="floating-square"></div>
              <div className="floating-triangle"></div>
            </div>
          </div>
        </div>

        {/* TIMELINE REAL (Sua Jornada) */}
        <div className="progress-timeline">
          <div className="timeline-header">
            <h3><FaChartLine /> Linha do Tempo da Evolução</h3>
            <p>Marcos importantes da sua trajetória</p>
          </div>
          <div className="timeline-container">
            
            {/* 1. Início da Jornada (Cadastro) */}
            <div className="timeline-item">
              <div className="timeline-dot active"></div>
              <div className="timeline-content">
                <h4>Início da Jornada</h4>
                <p>Cadastro na plataforma</p>
                <span className="timeline-date">
                    {formatRegistrationDate(userData.dataCadastro)}
                </span>
              </div>
            </div>

            {/* 2. Primeiro Projeto */}
            <div className="timeline-item">
              <div className={`timeline-dot ${realData.totalProjetos >= 1 ? 'active' : ''}`}></div>
              <div className="timeline-content">
                <h4>Primeiro Projeto</h4>
                <p>{userRole === 'ROLE_ALUNO' ? 'Inscrição' : 'Criação'}</p>
                <span className="timeline-date">
                    {formatRegistrationDate(realData.firstProjectDate) || 'Pendente'}
                </span>
              </div>
            </div>

            {/* 3. Networking (Primeiro Evento) */}
            <div className="timeline-item">
              <div className={`timeline-dot ${realData.totalEventos >= 1 ? 'active' : ''}`}></div>
              <div className="timeline-content">
                <h4>Networking</h4>
                <p>Participação no 1º Evento</p>
                <span className="timeline-date">
                    {formatRegistrationDate(realData.firstEventDate) || 'Pendente'}
                </span>
              </div>
            </div>

            {/* 4. Veterano (Meta) */}
            <div className="timeline-item">
              <div className={`timeline-dot ${realData.projetosConcluidos >= 5 ? 'active' : ''}`}></div>
              <div className="timeline-content">
                <h4>Veterano</h4>
                <p>5+ Concluídos</p>
                <span className="timeline-date">Meta</span>
              </div>
            </div>

          </div>
        </div>

        {/* CARDS DE ESTATÍSTICAS (GRID) */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{backgroundColor: '#e0f2fe', color: '#3298EF'}}>
                <FaBullseye />
            </div>
            <div className="stat-content">
                <h3>{userRole === 'ROLE_ALUNO' ? "Projetos" : "Vagas"}</h3>
                <div className="stat-value">
                    <span>{realData.totalProjetos}</span>
                    <span className="stat-suffix">ativos</span>
                </div>
                <div className="stat-trend"><FaArrowUp /> Atividade Recente</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{backgroundColor: '#dcfce7', color: '#10b981'}}>
                <FaMedal />
            </div>
            <div className="stat-content">
                <h3>{userRole === 'ROLE_ALUNO' ? "Concluídos" : "Encerradas"}</h3>
                <div className="stat-value">
                    <span>{realData.projetosConcluidos}</span>
                    <span className="stat-suffix">total</span>
                </div>
            </div>
          </div>

          <div className="stat-card">
             <div className="stat-icon" style={{backgroundColor: '#fef3c7', color: '#f59e0b'}}>
                <FaCalendarAlt />
            </div>
            <div className="stat-content">
                <h3>Eventos</h3>
                <div className="stat-value">
                    <span>{realData.totalEventos}</span>
                    <span className="stat-suffix">inscritos</span>
                </div>
            </div>
          </div>

          <div className="stat-card">
             <div className="stat-icon" style={{backgroundColor: '#ede9fe', color: '#8b5cf6'}}>
                <FaBolt />
            </div>
            <div className="stat-content">
                <h3>Tecnologias</h3>
                <div className="stat-value">
                    <span>{realData.tecnologiasDominadas}</span>
                    <span className="stat-suffix">skills</span>
                </div>
            </div>
          </div>
          
          {userRole === 'ROLE_EMPRESA' && (
             <div className="stat-card">
                <div className="stat-icon" style={{backgroundColor: '#fee2e2', color: '#ef4444'}}>
                    <FaUsers />
                </div>
                <div className="stat-content">
                    <h3>Candidatos</h3>
                    <div className="stat-value">
                        <span>{realData.colaboradores}</span>
                        <span className="stat-suffix">total</span>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* SEÇÃO DE GRÁFICOS */}
        <div className="charts-section">
          <div className="chart-row">
            {/* Gráfico de Linha */}
            <div className="chart-container">
              <h3><FaCalendarAlt className="chart-icon" /> Atividade Mensal ({new Date().getFullYear()})</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={realData.projetosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="projetos" name="Projetos" stroke="#3298EF" strokeWidth={3} dot={{ fill: '#3298EF', r: 4 }} />
                  <Line type="monotone" dataKey="concluidos" name="Concluídos" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                  <Line type="monotone" dataKey="eventos" name="Eventos" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Gráfico de Barras / Skills */}
            <div className="chart-container">
              <h3><FaChartLine className="chart-icon" /> Performance Geral</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { nome: 'Projetos', valor: realData.totalProjetos },
                  { nome: 'Conclusões', valor: realData.projetosConcluidos },
                  { nome: 'Eventos', valor: realData.totalEventos },
                  { nome: 'Skills', valor: realData.tecnologiasDominadas }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="nome" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="valor" fill="#3298EF" radius={[4, 4, 0, 0]} barSize={40}>
                     { [0,1,2,3].map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />) }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 🟢 NOVA Seção de Skills RESTAURADA (Estrutura HTML Original) */}
          {realData.tecnologias.length > 0 && (
             <div className="tech-skills">
                 <h3><FaCode className="chart-icon" /> Stack Tecnológica</h3>
                 <div className="tech-list">
                     {realData.tecnologias.map((tech, index) => (
                         <div key={index} className="tech-item">
                             <div style={{width: '100%'}}>
                                 <div className="tech-info">
                                     <span className="tech-name">{tech.nome}</span>
                                     {/* Exibe a porcentagem calculada */}
                                     <span className="tech-level">{tech.valor}%</span>
                                 </div>
                                 <div className="tech-bar">
                                     <div className="tech-progress" style={{ width: `${tech.valor}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
          )}
        </div>

        {/* CONQUISTAS */}
        <div className="achievements-section">
          <h3><FaBolt className="section-icon" /> Conquistas Desbloqueadas</h3>
          <div className="achievements-grid">
            {achievements.map((achievement) => {
              const isUnlocked = achievement.condition(realData);
              return (
                <div 
                  key={achievement.id} 
                  className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                  {isUnlocked && <div className="achievement-badge">Conquistado!</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}