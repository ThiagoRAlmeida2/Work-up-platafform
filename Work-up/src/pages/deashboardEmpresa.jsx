import React, { useState, useEffect } from "react";
import api from "../service/api";
import { FaUser, FaCheck, FaTimes, FaSync, FaProjectDiagram, FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa"; 
import Toast from "../components/Toast";
import { useNavigate } from 'react-router-dom'; 
import "../css/deashboardEmpresa.css"; 

const parseTagsString = (tagsString) => tagsString?.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) || [];
const getTagClassName = (tag) => `tag-chip tag-${tag.replace(/\s|#/g, '-').replace(/\+\+/g, 'plus-plus').replace(/\./g, '')}`;

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

const PerfilAlunoModal = ({ alunoId, onClose }) => {
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerfil = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await api.get(`/api/usuario/aluno/${alunoId}/perfil-detalhado`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setPerfil(res.data);
            } catch (error) {
                console.error("Erro ao buscar perfil detalhado:", error.response || error);
            } finally {
                setLoading(false);
            }
        };
        fetchPerfil();
    }, [alunoId]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
                {loading ? (
                    <p className="loading-text"><FaSync className="loading-spinner" size={20} /> Carregando perfil...</p>
                ) : perfil && perfil.aluno ? (
                    <>
                        <h2 className="modal-title">Perfil de {perfil.aluno.nome}</h2>
                        
                        <div className="perfil-detalhe-body">
                            {/* Coluna 1: Informações Básicas */}
                            <div className="detalhe-coluna-info">
                                <div className="detalhe-campo"><h4>Email:</h4><p>{perfil.email}</p></div>
                                <div className="detalhe-campo"><h4>Matrícula:</h4><p>{perfil.aluno.matricula}</p></div>
                                <div className="detalhe-campo"><h4>Curso:</h4><p>{perfil.aluno.curso}</p></div>

                                <div className="detalhe-campo detalhe-descricao">
                                    <h4>Descrição Pessoal:</h4>
                                    <p className="descricao-texto">{perfil.aluno.descricao || "Descrição não informada."}</p>
                                </div>
                            </div>
                            
                            <div className="detalhe-coluna-tags">
                                {/* Tags */}
                                <div className="detalhe-campo">
                                    <h4>Habilidades:</h4>
                                    <div className="tags-list">
                                        {parseTagsString(perfil.aluno.tags).map((tag) => (
                                            <span key={tag} className={getTagClassName(tag)}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Projetos Participados */}
                                <div className="detalhe-campo">
                                    <h4><FaProjectDiagram /> Projetos Participados ({perfil.aluno.projetosParticipados?.length || 0})</h4>
                                    <ul className="projetos-participados-lista">
                                        {perfil.aluno.projetosParticipados.map(p => (
                                            <li key={p.id}> 
                                                <strong>{p.nome}</strong> 
                                                <small>(Início: {p.dataInicio ? parseDate(p.dataInicio).toLocaleDateString('pt-BR') : 'N/I'})</small>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button className="btn-fechar-modal" onClick={onClose}>Fechar</button>
                    </>
                ) : (
                    <p className="loading-text">Não foi possível carregar os dados do perfil.</p>
                )}
            </div>
        </div>
    );
};

export default function EmpresaDashboard() {
    const navigate = useNavigate(); 
    
    const [candidatos, setCandidatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(null);
    const [toast, setToast] = useState(null);
    const token = localStorage.getItem("token");
    const baseURL = "/api/usuario";

    const fetchCandidatos = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${baseURL}/dashboard/candidatos`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCandidatos(res.data);
        } catch (error) {
            console.error("Erro ao carregar candidatos:", error.response || error);
            if (error.response?.status === 403) {
                setToast && setToast({ message: "Acesso negado. Você não é uma empresa ou está deslogado.", type: 'error' });
                navigate("/projetos"); 
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidatos();
    }, [token]);

    const handleAction = async (inscricaoId, actionType) => {
        const action = actionType.toLowerCase(); 
        const endpoint = `${baseURL}/inscricao/${inscricaoId}/${action}`;

        let finalStatus;
        if (action === 'aprovar') {
            finalStatus = 'APROVADO';
        } else if (action === 'rejeitar') {
            finalStatus = 'REJEITADO';
             finalStatus = actionType.toUpperCase();
        }

        try {
            await api.post(endpoint, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCandidatos(cands => cands.map(c => 
                c.inscricaoId === inscricaoId ? {...c, status: finalStatus} : c
            ));
            
        } catch (error) {
            setToast && setToast({ message: `Erro ao ${action}: ${error.response?.data || error.message}`, type: 'error' });
        }
    };

    if (loading) return <div className="dashboard-container"><FaSync className="loading-spinner" size={30} /> Carregando...</div>;
    
    // Layout de retorno
    return (
        <div className="dashboard-container">
            <div className="dashboard-header-controls">
                {/* Botão de Voltar */}
                <button 
                    className="btn-voltar-projetos" 
                    onClick={() => navigate("/projetos")}
                >
                    <FaArrowLeft size={16} style={{marginRight: '8px'}} />
                    Voltar para Projetos
                </button>
                
                <h2 className="dashboard-title">Dashboard de Candidatos</h2>
            </div>
            
            {candidatos.length === 0 ? (
                 <div className="no-data">
                    <p>Nenhum candidato encontrado para seus projetos ativos.</p>
                </div>
            ) : (
                <div className="dashboard-table-wrapper">
                    <table className="candidatos-table">
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Projeto</th>
                                <th>Data Inscrição</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidatos.map((c) => (
                                <tr key={c.inscricaoId}> 
                                    <td onClick={() => setAlunoSelecionadoId(c.alunoId)}>
                                        <div className="aluno-link" style={{cursor: 'pointer'}}>
                                            <FaUser size={14} style={{marginRight: '8px'}} />
                                            {c.alunoNome} 
                                            <span style={{color: 'var(--text-medium)', marginLeft: '6px'}}>
                                                 ({c.alunoMatricula})
                                            </span>
                                        </div>
                                    </td>
                                    <td>{c.projetoNome}</td>
                                    <td>{c.dataInscricao ? new Date(c.dataInscricao).toLocaleDateString('pt-BR') : 'N/I'}</td>
                                    
                                    <td className="status-cell">
                                        <span className={`status-tag status-${c.status.toLowerCase()}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    
                                    <td className="action-buttons">
                                        {c.status === 'PENDENTE' ? (
                                            <div style={{display: 'flex', gap: '10px'}}>
                                                <button 
                                                    className="btn-aprovar" 
                                                    onClick={() => handleAction(c.inscricaoId, 'Aprovar')}
                                                >
                                                    <FaCheck /> Aprovar
                                                </button>
                                                <button 
                                                    className="btn-declinar" 
                                                    onClick={() => handleAction(c.inscricaoId, 'Rejeitar')}
                                                >
                                                    <FaTimes /> Rejeitar
                                                </button>
                                            </div>
                                       ) : (
                                         <span 
                                                className={`action-completed status-${c.status.toLowerCase()}`}
                                                style={{
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    fontWeight: '700',
                                                    padding: '8px 14px',
                                                    borderRadius: '10px'
                                                }}
                                            >
                                            Ação Concluida!!
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            

            {alunoSelecionadoId && (
                <PerfilAlunoModal 
                    alunoId={alunoSelecionadoId} 
                    onClose={() => setAlunoSelecionadoId(null)} 
                />
            )}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
}