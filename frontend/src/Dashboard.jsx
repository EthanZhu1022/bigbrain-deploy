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

function Dashboard({ token }) {
  const [games, setGames] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [gameName, setGameName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5005/admin/games', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      setGames(res.data.games);
    }).catch(err => {
      console.error('Failed to load games:', err);
    });
  }, [token]);

  const createGame = async () => {
    const newGame = {
      id: Date.now(),
      name: gameName,
      owner: getEmailFromToken(token),
      thumbnail: '',
      questions: [],
      active: 0,
      createdAt: new Date().toISOString()
    };

    try {
      const updatedGames = [...games, newGame];
      await axios.put('http://localhost:5005/admin/games', { games: updatedGames }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGames(updatedGames);
      setShowModal(false);
      setGameName('');
    } catch (err) {
      console.error('Failed to create game:', err);
    }
  };

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

  return (
    <Container className="mt-4">
      <h2>Dashboard</h2>
      <Button onClick={() => setShowModal(true)}>Create New Game</Button>
      <Row className="mt-3">
        {games.map(game => (
          <Col key={game.id} md={4} className="mb-4">
            <Card style={{ position: 'relative' }}>
              <Card.Img variant="top" src={game.thumbnail || 'placeholder.png'} onClick={() => navigate(`/game/${game.id}`)} style={{ cursor: 'pointer' }} />
              <Button
                variant="danger"
                size="sm"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 1
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setGameToDelete(game);
                  setShowDeleteModal(true);
                }}
              >
                Del
              </Button>
              <Card.Body onClick={() => navigate(`/game/${game.id}`)} style={{ cursor: 'pointer' }}>
                <Card.Title>{game.name}</Card.Title>
                <Card.Text>
                  Questions: {game.questions.length}<br />
                  Duration: {game.questions.reduce((acc, q) => acc + (q.time || 0), 0)} seconds
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Game</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control type="text" placeholder="Enter game name" value={gameName} onChange={e => setGameName(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={createGame}>Create</Button>
        </Modal.Footer>
      </Modal>
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
    </Container>
  );
}

export default Dashboard;