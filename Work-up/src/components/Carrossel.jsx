import '../css/Carrossel.css'

export default function Carousel({ title = 'Projetos em Destaque', items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fadeClass, setFadeClass] = useState('fade-in')

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass('fade-out')

      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % items.length)
        setFadeClass('fade-in')
      }, 500)
    }, 4000)

    return () => clearInterval(interval)
  }, [items.length])

  return (
     <section className="carousel-section" aria-label={title}>
        <div className="carousel__header" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <h2 className="carousel__title">{title}</h2>
        </div>

        <div className="carousel__viewport" style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
        {items.length > 0 && (
            <article 
              className={`card ${fadeClass}`}
              style={{
                width: '100%',
                maxWidth: '620px',
                transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
              }}
              key={currentIndex}
            >
              <div className="card__media">
                <img src={items[currentIndex].image} alt={items[currentIndex].alt} className="card__image" />
                 {items[currentIndex].badge && <div className="card__badge">{items[currentIndex].badge}</div>}
              </div>
              <div className="card__body">
                <h3 className="card__title">{items[currentIndex].title}</h3>
                <p className="card__desc">{items[currentIndex].desc}</p>
              </div>
            </article>
          )}
        </div>
    </section>
  )
}
