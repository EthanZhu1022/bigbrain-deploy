import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import axios from 'axios';

/**
 * PlayGame Component
 * 
 * This component handles the player's entry point into a game session.
 * It displays a form for players to enter their name and join an active game session.
 * After successful join, it stores the player's ID and name in localStorage
 * and redirects them to the game screen.
 */
function PlayGame() {
  // Get the session ID from the URL parameters
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // State management
  const [playerName, setPlayerName] = useState(''); // Stores the player's name input
  const [error, setError] = useState(null); // Stores any error messages
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial session check
  const [isJoining, setIsJoining] = useState(false); // Loading state for join request
  const [sessionStatus, setSessionStatus] = useState(null); // Stores session status

  // Check session status on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get(`http://localhost:5005/play/${sessionId}/status`);
        setSessionStatus(response.data);
        
        // If session is finished, show error
        if (response.data.status === 'FINISHED') {
          setError('This game session has ended');
        }
      } catch (err) {
        setError('Invalid session ID or session not found');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [sessionId]);

  /**
   * Handles the form submission to join a game session
   * @param {Event} e - The form submission event
   */
  const joinGame = async (e) => {
    e.preventDefault();
    
    // Validate player name
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    // Check if session is active
    if (sessionStatus?.status !== 'ACTIVE') {
      setError('Cannot join this game session');
      return;
    }

    setIsJoining(true);
    try {
      // Send request to join the game session
      const response = await axios.post(`http://localhost:5005/play/${sessionId}/join`, {
        name: playerName
      });
      
      // Store player information in localStorage for future use
      localStorage.setItem('playerId', response.data.playerId);
      localStorage.setItem('playerName', playerName);
      
      // Navigate to the game screen
      navigate(`/play/${sessionId}/game`);
    } catch (err) {
      // Handle any errors from the join request
      setError(err.response?.data?.error || 'Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Card className="mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <Card.Title>Checking Session...</Card.Title>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Render error state if session is invalid or finished
  if (error && !sessionStatus) {
    return (
      <Container className="mt-5">
        <Card className="mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <Card.Title className="text-center mb-4">Error</Card.Title>
            <Alert variant="danger">{error}</Alert>
            <Button 
              variant="primary" 
              className="w-100 mt-3"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Card className="mx-auto" style={{ maxWidth: '500px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Join Game</Card.Title>
          
          {/* Display any error messages */}
          {error && <Alert variant="danger">{error}</Alert>}
          
          {/* Player name input form */}
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
            
            {/* Submit button */}
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100"
              disabled={isJoining || sessionStatus?.status !== 'ACTIVE'}
            >
              {isJoining ? 'Joining...' : 'Join Game'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PlayGame;