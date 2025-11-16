import "../css/Eventos.css";

export default function DescEventos() {
  return (
    <section className="desc-eventos">
      <div className="desc-container">
        <h1 className="desc-titulo">🎉 Ache seu próximo evento Tech</h1>

        <p className="desc-texto">
          Quer viver experiências incríveis no mundo da inovação? <br />
          Em breve, você encontrará os melhores eventos de tecnologia:
          conferências, workshops, hackathons, meetups, cursos, feiras e muito
          mais. <br />
          Acompanhe a programação da tecnologia na capital do futuro e fique por
          dentro das novidades em inovação, startups, programação e
          transformação digital. <br />
          Não perca a chance de se conectar, aprender e evoluir!
        </p>

        <div className="desc-botao-container">
          <button className="desc-botao">🔍 Buscar experiências</button>
        </div>
      </div>
    </section>
  );
}
