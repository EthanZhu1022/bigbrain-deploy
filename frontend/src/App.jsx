import { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Pages from './Pages.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './custom-theme.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={`min-vh-100 position-relative ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
      <div className="position-absolute bottom-0 end-0 m-3">
        <button
          onClick={toggleDarkMode}
          className={`btn ${darkMode ? 'btn-secondary' : 'btn-outline-dark'} shadow`}
        >
          Dark Mode
        </button>
      </div>

      <Router>
        <Pages />
      </Router>
    </div>
  );
}

export default App;
