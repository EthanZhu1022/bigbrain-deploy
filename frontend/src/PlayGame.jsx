import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import axios from 'axios';

function PlayGame() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  const joinGame = async (e) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    try {
      const response = await axios.post(`http://localhost:5005/play/join/${sessionId}`, {
        name: playerName
      });

      const playerId = response.data.playerId;
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('playerName', playerName);

      const statusRes = await axios.get(`http://localhost:5005/play/${playerId}/status`);
      const statusData = statusRes.data;

      navigate(`/play/${sessionId}/game`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card className="mx-auto" style={{ maxWidth: '500px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Join Game</Card.Title>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={joinGame}>
            <Form.Group className="mb-3">
              <Form.Label>Your Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={isJoining}
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Game'}
            </Button>
          </Form>

          <Button
            variant="secondary"
            className="w-100 mt-3"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PlayGame;
