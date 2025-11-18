import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, Target, Users, Award, Zap, Rocket, Star, Activity, Calendar } from "lucide-react";
import api from "../service/api.js";

const COLORS = ['#3298EF', '#312e81', '#1e1b4b', '#0078D1', '#111827', '#6366f1', '#8b5cf6', '#06b6d4'];

const mockData = {
  totalProjetos: 0,
  projetosConcluidos: 0,
  duracaoMedia: 0,
  tecnologiasDominadas: 0,
  colaboradores: 0,
  avaliacaoMedia: 0,
  
  projetosPorMes: [
    { mes: 'Jan', projetos: 3, concluidos: 2 },
    { mes: 'Fev', projetos: 5, concluidos: 4 },
    { mes: 'Mar', projetos: 7, concluidos: 6 },
    { mes: 'Abr', projetos: 4, concluidos: 4 },
    { mes: 'Mai', projetos: 8, concluidos: 7 },
    { mes: 'Jun', projetos: 6, concluidos: 5 },
    { mes: 'Jul', projetos: 9, concluidos: 8 },
    { mes: 'Ago', projetos: 5, concluidos: 6 }
  ],
  
  tecnologias: [
    { nome: 'React', nivel: 95, projetos: 15 },
    { nome: 'Node.js', nivel: 88, projetos: 12 },
    { nome: 'Python', nivel: 82, projetos: 10 },
    { nome: 'Java', nivel: 78, projetos: 8 },
    { nome: 'TypeScript', nivel: 85, projetos: 11 },
    { nome: 'MySQL', nivel: 80, projetos: 14 }
  ],
  
  categorias: [
    { nome: 'Frontend', valor: 35, cor: '#3298EF' },
    { nome: 'Backend', valor: 28, cor: '#312e81' },
    { nome: 'Mobile', valor: 20, cor: '#1e1b4b' },
    { nome: 'DevOps', valor: 17, cor: '#0078D1' }
  ],
  
  habilidades: [
    { skill: 'Liderança', A: 85, fullMark: 100 },
    { skill: 'Comunicação', A: 92, fullMark: 100 },
    { skill: 'Resolução', A: 88, fullMark: 100 },
    { skill: 'Criatividade', A: 90, fullMark: 100 },
    { skill: 'Adaptação', A: 87, fullMark: 100 },
    { skill: 'Trabalho em Equipe', A: 94, fullMark: 100 }
  ]
};

export default function Evolucao() {
  const [animatedStats, setAnimatedStats] = useState({
    totalProjetos: 0,
    projetosConcluidos: 0,
    duracaoMedia: 0,
    tecnologiasDominadas: 0,
    colaboradores: 0,
    avaliacaoMedia: 0
  });
  
  const [realData, setRealData] = useState(mockData);
  const [loading, setLoading] = useState(true);

  // Sistema de conquistas
  const achievements = [
    {
      id: 'primeiro_projeto',
      icon: '🎯',
      title: 'Primeiro Passo',
      description: 'Participou do primeiro projeto',
      condition: (data) => data.totalProjetos >= 1
    },
    {
      id: 'top_performer',
      icon: '🏆',
      title: 'Alto Desempenho',
      description: 'Concluiu 5 ou mais projetos',
      condition: (data) => data.projetosConcluidos >= 5
    },
    {
      id: 'tech_explorer',
      icon: '🚀',
      title: 'Explorador Tecnológico',
      description: 'Dominou 3 ou mais tecnologias',
      condition: (data) => data.tecnologiasDominadas >= 3
    },
    {
      id: 'team_player',
      icon: '⭐',
      title: 'Jogador de Equipe',
      description: 'Trabalhou com 10+ colaboradores',
      condition: (data) => data.colaboradores >= 10
    },
    {
      id: 'quality_master',
      icon: '💎',
      title: 'Mestre da Qualidade',
      description: 'Mantém avaliação acima de 4.5',
      condition: (data) => data.avaliacaoMedia >= 4.5
    },
    {
      id: 'speed_demon',
      icon: '⚡',
      title: 'Velocidade Máxima',
      description: 'Duração média abaixo de 2 meses',
      condition: (data) => data.duracaoMedia > 0 && data.duracaoMedia <= 2
    },
    {
      id: 'veteran',
      icon: '🏅',
      title: 'Veterano da Plataforma',
      description: 'Participou de 10+ projetos',
      condition: (data) => data.totalProjetos >= 10
    },
    {
      id: 'perfectionist',
      icon: '🌟',
      title: 'Perfeccionista',
      description: 'Taxa de conclusão de 100%',
      condition: (data) => data.totalProjetos > 0 && data.projetosConcluidos === data.totalProjetos
    }
  ];

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Buscar projetos do usuário
      const projetosResponse = await api.get('/projetos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const projetos = projetosResponse.data || [];
      const userProjetos = projetos.filter(p => 
        user.aluno ? p.inscricoes?.some(i => i.aluno?.id === user.aluno.id) :
        user.empresa ? p.empresa?.id === user.empresa.id : false
      );
      
      const projetosConcluidos = userProjetos.filter(p => p.status === 'CONCLUIDO').length;
      const projetosAtivos = userProjetos.filter(p => p.status === 'ATIVO').length;
      
      // Calcular duração média (simulado)
      const duracaoMedia = userProjetos.length > 0 ? 
        userProjetos.reduce((acc, p) => acc + (Math.random() * 4 + 1), 0) / userProjetos.length : 0;
      
      // Contar tecnologias únicas
      const tecnologias = new Set();
      userProjetos.forEach(p => {
        if (p.tecnologias) {
          p.tecnologias.split(',').forEach(tech => tecnologias.add(tech.trim()));
        }
      });
      
      // Contar colaboradores únicos
      const colaboradores = new Set();
      userProjetos.forEach(p => {
        if (p.inscricoes) {
          p.inscricoes.forEach(i => {
            if (i.aluno) colaboradores.add(i.aluno.id);
          });
        }
        if (p.empresa) colaboradores.add(p.empresa.id);
      });
      
      const newData = {
        ...mockData,
        totalProjetos: userProjetos.length,
        projetosConcluidos,
        duracaoMedia: Number(duracaoMedia.toFixed(1)),
        tecnologiasDominadas: tecnologias.size,
        colaboradores: colaboradores.size,
        avaliacaoMedia: 4.5 + (Math.random() * 0.5)
      };
      
      setRealData(newData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const animateNumbers = () => {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setAnimatedStats({
          totalProjetos: Math.floor(realData.totalProjetos * progress),
          projetosConcluidos: Math.floor(realData.projetosConcluidos * progress),
          duracaoMedia: Number((realData.duracaoMedia * progress).toFixed(1)),
          tecnologiasDominadas: Math.floor(realData.tecnologiasDominadas * progress),
          colaboradores: Math.floor(realData.colaboradores * progress),
          avaliacaoMedia: Number((realData.avaliacaoMedia * progress).toFixed(1))
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, stepDuration);
    };
    
    if (!loading) {
      animateNumbers();
    }
  }, [realData, loading]);

  const StatCard = ({ icon: Icon, title, value, suffix = '', color = '#3298EF', trend = null }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">
          <span>{value}</span>
          <span className="stat-suffix">{suffix}</span>
        </div>
        {trend && (
          <div className="stat-trend">
            <TrendingUp size={16} />
            <span>+{trend}% este mês</span>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="evolucoes-page">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀</div>
            <p>Carregando seus dados de evolução...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="evolucoes-page">
      <div className="container">
        {/* Header */}
        <div className="evolucoes-header">
          <div className="header-content">
            <h1 className="page-title">
              <Rocket className="title-icon" />
              Evolução Profissional
            </h1>
            <p className="page-subtitle">
              Acompanhe seu crescimento profissional e conquistas na plataforma
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

        {/* Progress Timeline */}
        <div className="progress-timeline">
          <div className="timeline-header">
            <h3><Activity className="section-icon" />Linha do Tempo da Evolução</h3>
            <p>Acompanhe sua jornada de crescimento na plataforma</p>
          </div>
          <div className="timeline-container">
            <div className="timeline-item">
              <div className="timeline-dot active"></div>
              <div className="timeline-content">
                <h4>Início da Jornada</h4>
                <p>Primeiro projeto iniciado</p>
                <span className="timeline-date">Janeiro 2024</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot active"></div>
              <div className="timeline-content">
                <h4>Primeira Conquista</h4>
                <p>Projeto concluído com sucesso</p>
                <span className="timeline-date">Março 2024</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot active"></div>
              <div className="timeline-content">
                <h4>Expansão Tecnológica</h4>
                <p>Domínio de novas tecnologias</p>
                <span className="timeline-date">Junho 2024</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Próximo Nível</h4>
                <p>Meta: 10 projetos concluídos</p>
                <span className="timeline-date">Em breve</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatCard 
            icon={Target} 
            title="Total de Projetos" 
            value={animatedStats.totalProjetos} 
            color="#3298EF"
            trend={12}
          />
          <StatCard 
            icon={Award} 
            title="Projetos Concluídos" 
            value={animatedStats.projetosConcluidos} 
            color="#10b981"
            trend={8}
          />
          <StatCard 
            icon={Clock} 
            title="Duração Média" 
            value={animatedStats.duracaoMedia} 
            suffix=" meses"
            color="#f59e0b"
          />
          <StatCard 
            icon={Target} 
            title="Tecnologias" 
            value={animatedStats.tecnologiasDominadas} 
            color="#8b5cf6"
            trend={15}
          />
          <StatCard 
            icon={Users} 
            title="Colaboradores" 
            value={animatedStats.colaboradores} 
            color="#ef4444"
          />
          <StatCard 
            icon={Star} 
            title="Avaliação Média" 
            value={animatedStats.avaliacaoMedia} 
            suffix="/5.0"
            color="#06b6d4"
          />
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-row">
            <div className="chart-container">
              <h3><Calendar className="chart-icon" />Evolução Mensal</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockData.projetosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Line type="monotone" dataKey="projetos" stroke="#3298EF" strokeWidth={3} dot={{ fill: '#3298EF', strokeWidth: 2, r: 6 }} />
                  <Line type="monotone" dataKey="concluidos" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-container">
              <h3><Target className="chart-icon" />Performance Geral</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { nome: 'Iniciados', valor: realData.totalProjetos },
                  { nome: 'Concluídos', valor: realData.projetosConcluidos },
                  { nome: 'Tecnologias', valor: realData.tecnologiasDominadas },
                  { nome: 'Colaboradores', valor: realData.colaboradores }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="nome" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Bar dataKey="valor" fill="#3298EF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="achievements-section">
          <h3><Zap className="section-icon" />Conquistas</h3>
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