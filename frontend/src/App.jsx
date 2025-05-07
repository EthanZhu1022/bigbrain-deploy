import { useState } from "react";
import {
  BrowserRouter as Router,
} from "react-router-dom";
import Pages from './Pages.jsx';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const appClasses = `min-vh-100 position-relative ${darkMode ? 'bg-dark text-white' : 'bg-info text-dark'}`;
  const buttonClasses = `btn ${darkMode ? 'btn-dark text-light' : 'btn-light text-dark'} shadow`;

  return (
    <div className={appClasses}>
      <div className="position-absolute bottom-0 end-0 m-3">
        <button
          onClick={toggleDarkMode}
          className={buttonClasses}
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

