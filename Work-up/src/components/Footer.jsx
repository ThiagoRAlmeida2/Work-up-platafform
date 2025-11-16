import '../css/Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="contato">
      <div className="footer__content">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <h3 className="footer__brand-title">Sobre nós</h3>
              <p className="footer__description">
                Unimos talentos que buscam liberdade e propósito. Conectamos freelancers a projetos que inspiram, valorizam criatividade e geram crescimento real, transformando cada desafio em uma nova conquista profissional.
              </p>
            </div>
            
            <div className="footer__section">
              <h4>Empresa</h4>
              <ul>
                <li><a href="/">Início</a></li>
                <li><a href="/eventos">Eventos</a></li>
                <li><a href="/projetos">Projetos</a></li>
              </ul>
            </div>
            
            <div className="footer__section">
              <h4>Para Freelancers</h4>
              <ul>
                <li><a href="#">Encontre Projetos</a></li>
                <li><a href="#">Mostre seu Portfólio</a></li>
                <li><a href="#">Trabalhe em Equipe</a></li>
                <li><a href="#">Cresça na Comunidade</a></li>
              </ul>
            </div>
            
            <div className="footer__section">
              <h4>Para Empresas</h4>
              <ul>
                <li><a href="#">Publique Oportunidades</a></li>
                <li><a href="#">Contrate Talentos</a></li>
                <li><a href="#">Consultoria sob Demanda</a></li>
                <li><a href="#">Suporte Dedicado</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer__bottom">
            <p>© {new Date().getFullYear()} Work Up. Todos os direitos reservados.</p>
            <div className="footer__links">
              <a href="#">Política de Privacidade</a>
              <a href="#">Termos de Serviço</a>
              <a href="#">Política de Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}