import { useEffect, useState } from 'react';
import { Container, Card, Button, Row, Col, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function getEmailFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email;
  } catch {
    return '';
  }
}

/**
 * Dashboard Component
 * 
 * Displays a list of games and provides functionality to:
 * - Create new games
 * - Delete games
 * - Start game sessions
 * - Stop game sessions
 * - View game results
 */
function Dashboard({ token }) {
  const [games, setGames] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [gameName, setGameName] = useState('');
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [thumbnail, setThumbnail] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [gameToStop, setGameToStop] = useState(null);
  const navigate = useNavigate();

  // Fetch games on component mount and when token changes
  useEffect(() => {
    fetchGames();
  }, [token]);

  const sortGames = (gamesList) => {
    return [...gamesList]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // 先按时间
      .sort((a, b) => {
        const aActive = a.active !== null;
        const bActive = b.active !== null;
        return bActive - aActive; // true - false → 正在进行的排前面
      });
  };

  /**
   * Fetches the list of games from the server
   */
  const fetchGames = async () => {
    try {
      const res = await axios.get('http://localhost:5005/admin/games', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sorted = sortGames(res.data.games || []);
      setGames(sorted);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  };  

  /**
   * Creates a new game
   */
  const createGame = async () => {
    const newGame = {
      id: String(Date.now()),
      name: gameName,
      owner: getEmailFromToken(token),
      thumbnail: thumbnail,
      questions: uploadedQuestions,
      active: 0,
      createdAt: new Date().toISOString()
    };
  
    try {
      const updatedGames = [...games, newGame];
      await axios.put('http://localhost:5005/admin/games', { games: updatedGames }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGames();
      setShowModal(false);
      setGameName('');
      setUploadedQuestions([]);
      setThumbnail('')
    } catch (err) {
      console.error('Failed to create game:', err);
    }
  };

  const handleJoinGame = () => {
    if (!joinSessionId.trim()) return;
    navigate(`/play/${joinSessionId}`);
    setShowJoinModal(false);
    setJoinSessionId('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
  
      if (!jsonData.name || !Array.isArray(jsonData.questions)) {
        alert("Invalid JSON structure. File must contain 'name' and 'questions'.");
        return;
      }
  
      setGameName(jsonData.name);
      setUploadedQuestions(jsonData.questions);
      if (jsonData.thumbnail) {
        setThumbnail(jsonData.thumbnail);
      }

    } catch (err) {
      alert("Error parsing JSON file.");
    }
  };

  /**
   * Deletes a game
   */
  const confirmDeleteGame = () => {
    const updatedGames = games.filter(g => g.id !== gameToDelete.id);
    axios.put('http://localhost:5005/admin/games', { games: updatedGames }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setGames(updatedGames);
      setShowDeleteModal(false);
      setGameToDelete(null);
    }).catch(err => {
      console.error('Failed to delete game:', err);
    });
  };

  /**
   * Starts a game session
   * @param {string} gameId - The ID of the game to start
   */
  const startGame = async (gameId) => {
    try {
      await axios.post(`http://localhost:5005/admin/game/${gameId}/mutate`, {
        mutationType: 'START'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      let sessionId = null;
      let updatedGames = [];
  
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await axios.get('http://localhost:5005/admin/games', {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        updatedGames = res.data.games;
        const game = updatedGames.find(g => g.id === gameId);
        sessionId = game?.active;
  
        if (sessionId) break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
  
      if (!sessionId) {
        console.error('No session ID found in game data');
        return;
      }

      const finalGames = updatedGames.map(g => {
        if (g.id === gameId) {
          return { ...g, active: sessionId };
        }
        return g;
      });
  
      await axios.put('http://localhost:5005/admin/games', {
        games: finalGames
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      setGames(sortGames(updatedGames));
      setActiveSession({ gameId, sessionId });
      setShowSessionModal(true);
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };  

  /**
   * Stops a game session
   * @param {string} gameId - The ID of the game to stop
   */
  const stopGame = async (gameId) => {
    try {
      await axios.post(`http://localhost:5005/admin/game/${gameId}/mutate`, {
        mutationType: 'END'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setGameToStop(gameId);
      setShowResultsModal(true);
      await fetchGames();
    } catch (err) {
      console.error('Failed to stop game:', err);
    }
  };

  /**
   * Copies the session link to clipboard
   */
  const copySessionLink = () => {
    if (!activeSession?.sessionId) {
      console.error('No active session ID available');
      return;
    }
    const url = `${window.location.origin}/play/${activeSession.sessionId}`;
    navigator.clipboard.writeText(url);
  };

  /**
   * Navigates to the results screen for a session
   * @param {string} sessionId - The ID of the session to view results for
   */
  const viewResults = (sessionId) => {
    setShowResultsModal(false);
    navigate(`/session/${sessionId}`);
  };

  return (
    <Container className="mt-4">
      <h2>Dashboard</h2>
      <Button onClick={() => setShowModal(true)}>Create New Game</Button>
      &nbsp;
      <Button variant="secondary" onClick={() => setShowJoinModal(true)}>Join Game</Button>
      <Row className="mt-3">
        {games.map(game => (
          <Col key={game.id} md={4} className="mb-4">
            <Card style={{ position: 'relative' }}>
              <Card.Img variant="top" src={game.thumbnail || 'placeholder.png'} onClick={() => navigate(`/game/${game.id}`)} style={{ height: '180px', objectFit: 'cover', objectPosition: 'center', cursor: 'pointer' }} />
              <Button variant="danger" size="sm" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }} onClick={(e) => { e.stopPropagation(); setGameToDelete(game); setShowDeleteModal(true); }} >Del</Button>
              <Card.Body onClick={() => navigate(`/game/${game.id}`)} style={{ cursor: 'pointer' }}>
                <Card.Title>{game.name}</Card.Title>
                <Card.Text>
                  Questions: {game.questions.length}<br />
                  Duration: {game.questions.reduce((acc, q) => acc + (q.time || 0), 0)} seconds
                </Card.Text>
                <div className="d-flex gap-2">
                  <Button 
                    variant={game.active ? "success" : "primary"} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!game.active) {
                        startGame(game.id);
                      }
                    }}
                    disabled={game.active}
                  >
                    {game.active ? "Game Active" : "Start Game"}
                  </Button>
                  {game.active && (
                    <Button 
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        stopGame(game.id);
                      }}
                    >
                      Stop Game
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create Game Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Game</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control type="text" placeholder="Enter game name" value={gameName} onChange={e => setGameName(e.target.value)} />
          <Form.Label>Or Upload Game File</Form.Label>
          <Form.Control type="file" accept=".json" onChange={handleFileUpload} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={createGame}>Create</Button>
        </Modal.Footer>
      </Modal>

      {/* Join Game Modal */}
      <Modal show={showJoinModal} onHide={() => setShowJoinModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Join Game</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            placeholder="Enter session ID"
            value={joinSessionId}
            onChange={e => setJoinSessionId(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowJoinModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleJoinGame}>Join</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Game Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{gameToDelete?.name}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeleteGame}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Session Started Modal */}
      <Modal show={showSessionModal} onHide={() => setShowSessionModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Game Session Started</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Session ID: <strong>{activeSession?.sessionId || 'Loading...'}</strong></p>
          <p>Share this link with players to join the game:</p>
          <div className="d-flex align-items-center">
            <Form.Control 
              type="text" 
              value={activeSession?.sessionId ? `${window.location.origin}/play/${activeSession.sessionId}` : 'Loading...'} 
              readOnly 
            />
            <Button 
              variant="primary" 
              className="ms-2" 
              onClick={copySessionLink}
              disabled={!activeSession?.sessionId}
            >
              Copy Link
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSessionModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* View Results Modal */}
      <Modal show={showResultsModal} onHide={() => setShowResultsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Game Session Stopped</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Would you like to view the results?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResultsModal(false)}>No</Button>
          <Button variant="primary" onClick={() => viewResults(gameToStop)}>Yes</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Dashboard;