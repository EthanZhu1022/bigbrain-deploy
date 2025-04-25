import { useState } from "react";
import {
  BrowserRouter as Router,
} from "react-router-dom";
import Pages from './Pages.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const backgroundColor = darkMode ? '#2e2e2e' : '#d0ebff';
  const textColor = darkMode ? '#ffffff' : '#000000';

  return (
    <div style={{ minHeight: '100vh', backgroundColor, color: textColor, position: 'relative' }}>
      <div style={{ position: 'absolute', top: '70px', right: '20px' }}>
        <button
          onClick={toggleDarkMode}
          style={{
            backgroundColor: darkMode ? '#444' : '#eee',
            color: darkMode ? '#fff' : '#000',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '5px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
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