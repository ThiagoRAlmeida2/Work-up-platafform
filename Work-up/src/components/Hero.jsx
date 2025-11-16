import Carousel from '../components/Carrossel.jsx'
import '../css/Hero.css'

import appspagamentoImg from '../assets/IMG/appspagamento.png';
import kairosImg from '../assets/IMG/Kairos-techevent.png';
import ecommerceImg from '../assets/IMG/e-commerce-moda.png';
import machineLearningImg from '../assets/IMG/Machine learning.jpg';
import innovationContestImg from '../assets/IMG/Innovation Contest.jpg';

const items = [
  { title: 'App de Pagamentos', desc: 'Integração PIX, boletos e dashboard.', badge: 'Fintech', image: appspagamentoImg, alt: 'App de pagamentos' },
  { title: 'Evento Kairos Tech', desc: 'Edição 2025 – palestras e workshops.', badge: 'Evento', image: kairosImg, alt: 'Evento Kairos' },
  { title: 'E-commerce Moda', desc: 'Next.js + CMS + checkout.', badge: 'E-commerce', image: ecommerceImg, alt: 'E-commerce' },
  { title: 'Portal Corporativo', desc: 'Autenticação SSO e intranet.', badge: 'Enterprise', 
    image: innovationContestImg,
    alt: 'Portal' 
  },
  { title: 'API Analytics', desc: 'Pipelines e relatórios de dados.', badge: 'Dados', 
    image: machineLearningImg,
    alt: 'Analytics' 
  },
]

export default function Hero({ onCadastroClick }){
  return (
    <section className="hero">
        <div className="hero__content-grid">
            
            <div className="hero__about">
                <h1 className="about__title">Pratique o Futuro da Tecnologia. Hoje.</h1>
                <p className="about__subtitle">
                  Somos a ponte essencial entre a excelência acadêmica e a inovação empresarial. Nossa plataforma transforma o aprendizado teórico em experiência prática, conectando estudantes talentosos a desafios reais de desenvolvimento propostos por empresas líderes.                
                </p>
                <h3 className="about__section-title">Nossa Missão</h3>
                <p className="about__description">
                  Oferecer um ambiente colaborativo e de alto impacto, onde estudantes podem desenvolver habilidades de mercado, construir portfólios verificados e receber mentoria especializada. Consequentemente, garantimos às empresas acesso direto e eficiente a talentos emergentes e soluções inovadoras.    
                </p>
                <div className="about__buttons">
                    <a href="/projetos" className="btn btn--primary">Ver Projetos Ativos</a>
                    <a href="/eventos" className="btn btn--light">Eventos</a>
                </div>
            </div>

            <div className="hero__carousel-wrapper">
                <Carousel title="Projetos em Destaque" items={items} />
            </div>

        </div>
    </section>
  );
}