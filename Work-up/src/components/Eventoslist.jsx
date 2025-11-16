import CardEvento from "./CardEvento";
import "../css/Eventos.css";

export default function EventosList({ onViewDetails }) {
  const eventos = [
    {
      imagem: "",
      titulo: "TechConf Recife",
      descricao: "O maior encontro de desenvolvedores do ano",
    },
    {
      imagem: "",
      titulo: "Hackathon Inova",
      descricao: "Crie soluções inovadoras em 48h!",
    },
    {
      imagem: "",
      titulo: "Workshop React",
      descricao: "Aprenda React moderno com especialistas.",
    },
    {
      imagem: "",
      titulo: "Feira de Startups",
      descricao: "Conheça ideias revolucionárias e novos produtos.",
    },
    {
      imagem: "",
      titulo: "Encontro AI Brasil",
      descricao: "Tudo sobre inteligência artificial e inovação.",
    },
    {
      imagem: "",
      titulo: "Summit Cloud Tech",
      descricao: "O futuro da computação em nuvem.",
    },
  ];

  return (
    <section className="eventos-list">
      {eventos.map((evento, index) => (
        <CardEvento
          key={index}
          {...evento}
          onViewDetails={typeof onViewDetails === 'function' ? () => onViewDetails(evento) : undefined}
        />
      ))}
    </section>
  );
}
