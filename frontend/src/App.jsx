import { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Pages from "./Pages.jsx";
import { Button, Container } from "react-bootstrap";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <div
      className={`min-h-screen relative ${
        darkMode ? "bg-gray-900 text-white" : "bg-blue-100 text-black"
      }`}
    >
      <div className="absolute bottom-4 right-4">
        <Button
          variant={darkMode ? "dark" : "light"}
          onClick={toggleDarkMode}
        >
          Toggle Dark Mode
        </Button>
      </div>

      <Router>
        <Container className="py-4">
          <Pages />
        </Container>
      </Router>
    </div>
  );
}

export default App;
