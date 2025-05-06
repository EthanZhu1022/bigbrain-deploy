import { useState, useEffect } from 'react';
import axios from 'axios';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard';
import {
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { Container, Button, Alert, Navbar, Nav } from 'react-bootstrap';
import EditGame from './EditGame';
import EditQuestion from './EditQuestion';
import PlayGame from './PlayGame';
import GameScreen from './GameScreen';
import SessionResults from './SessionResults';
import GameControl from './GameControl';
import Lobby from './Lobby';
import SessionHistory from './SessionHistory';

function Pages() {

  const [token,setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    setTimeout(() => setLoading(false), 500);
  },[]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const successJob = (token) => {
    localStorage.setItem('token', token);
    setToken(token);
    showToast('Login successful', 'success');
    navigate('/dashboard');
  }

  const logout = async () => {
    try{
      await axios.post('https://bigbrain-backend-qff3.onrender.com/admin/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      localStorage.removeItem('token');
      setToken(null);
      showToast('Logout successful', 'success');
      navigate('/login');
    } catch (err){
      showToast(err.response?.data?.error || 'Logout failed', 'danger');
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return(
    <Container fluid className="app-background min-vh-100 p-0">
      {toast && (
        <Alert variant={toast.type} onClose={() => setToast(null)} dismissible>
          {toast.message}
        </Alert>
      )}

      <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#">BigBrain</Navbar.Brand>
          <Nav className="ms-auto">
            {token ? (
              <Button variant="outline-light" onClick={logout}>Logout</Button>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Container>
      </Navbar>

      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/register" element={<Register token={token} successJob={successJob} showToast={showToast} />} />
        <Route path="/login" element={<Login token={token} successJob={successJob} showToast={showToast} />} />
        <Route path="/dashboard" element={<Dashboard token={token} />} />
        <Route path="/game/:gameId" element={<EditGame token={token} showToast={showToast} />} />
        <Route path="/game/:gameId/question/:questionId" element={<EditQuestion token={token} showToast={showToast} />} />
        <Route path="/play/:sessionId" element={<PlayGame />} />
        <Route path="/play/:playerId/game" element={<GameScreen showToast={showToast}/>} />
        <Route path="/session/:sessionId" element={<SessionResults token={token} />} />
        <Route path="/gamecontrol/:gameId/:sessionId" element={<GameControl token={token} showToast={showToast} />} />
        <Route path="/play/:playerId/lobby" element={<Lobby />} />
        <Route path="/history/:gameId" element={<SessionHistory />} />
      </Routes>
    </Container>
  )
}

export default Pages;

