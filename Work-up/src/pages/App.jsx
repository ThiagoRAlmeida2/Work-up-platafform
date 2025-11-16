import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function App() {
  const location = useLocation();
  
  
  return (
    <div className="app">
      <Navbar />
      <main>
        <Outlet />
      </main>
      {location.pathname === '/' && <Footer />}
    </div>
  );
}
