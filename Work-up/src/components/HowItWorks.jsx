function Step({ index, title, desc }) {
  return (
    <div className="step">
      <div className="step__index">{index}</div>
      <div className="step__content">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  )
}

export default function HowItWorks({ onCadastroClick }) {
  const handleInterestClick = (e) => {
    e.preventDefault();
    console.log('Botão cadastre-se clicado', onCadastroClick);
    if (onCadastroClick) {
      onCadastroClick();
    }
  };

  return (
    <section id="como-funciona" className="how" aria-labelledby="como-title">
      <div className="container">
        <h2 id="como-title">Como Funciona</h2>
        <p className="section-subtitle">Um processo simples e seguro para conectar empresas e alunos</p>

        <div className="how__cards">
          <article className="how__card">
            <h3>Para Empresas</h3>
            <Step index="1" title="Publique seu projeto" desc="Descreva o que precisa, prazos e requisitos técnicos." />
            <Step index="2" title="Receba candidaturas" desc="Estudantes qualificados se inscrevem no seu projeto." />
            <Step index="3" title="Gerencie e aprove" desc="Acompanhe o progresso e aprove os melhores candidatos." />
          </article>

        <article className="how__card">
            <h3>Para Estudantes</h3>
            <Step index="1" title="Complete seu perfil" desc="Destaque suas habilidades, tecnologias e experiência." />
            <Step index="2" title="Candidate-se a projetos" desc="Encontre projetos que combinam com seu perfil." />
            <Step index="3" title="Desenvolva na prática" desc="Ganhe experiência real e construa seu portfólio." />
          </article>
        </div>
        
        <div className="how__action">
          <button className="btn btn--primary" onClick={handleInterestClick}>Comece Agora</button>
        </div>
      </div>
    </section>
  )
}
