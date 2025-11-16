import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import "../css/Eventos.css";

export default function CardEvento({ imagem, titulo, descricao, date, location, category, onViewDetails }) {
  const placeholder = "https://via.placeholder.com/300x180/9b72cf/ffffff?text=Evento+Tech";

  const eventPayload = { imagem, titulo, descricao, date, location, category };

  return (
    <div className="event-card">
      <div className="event-image">
        <img src={imagem || placeholder} alt={titulo} />
        <div className="event-category-badge">{category || "Evento"}</div>
      </div>

      <div className="event-info">
        <h3>{titulo}</h3>
        {date && <p className="event-date"><FaCalendarAlt /> {date}</p>}
        {location && <p className="event-location"><FaMapMarkerAlt /> {location}</p>}
        {descricao && <p className="event-description">{descricao}</p>}
      </div>

      <button
        className="btn-ver-detalhes"
        onClick={(e) => {
          e.stopPropagation();
          if (typeof onViewDetails === 'function') onViewDetails(eventPayload);
        }}
      >
        Ver Detalhes
      </button>
    </div>
  );
}
