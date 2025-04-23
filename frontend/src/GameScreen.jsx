import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import axios from 'axios';
function GameScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  // State management
  const [gameState, setGameState] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get player info from localStorage
  const playerId = localStorage.getItem('playerId');
  const playerName = localStorage.getItem('playerName');

  // Check if player is authenticated
  useEffect(() => {
    if (!playerId || !playerName) {
      navigate(`/play/${sessionId}`);
    }
  }, [playerId, playerName, sessionId, navigate]);
  // Poll for game state updates
  useEffect(() => {
    const pollGameState = async () => {
      try {
        const response = await axios.get(`http://localhost:5005/play/${sessionId}/status`);
        const { gameState, currentQuestion, timeLeft } = response.data;
        setGameState(gameState);
        setCurrentQuestion(currentQuestion);
        setTimeLeft(timeLeft);
        // If game hasn't started, show waiting screen
        if (gameState === 'WAITING') {
          setIsLoading(false);
          return;
        }
        // If game is over, navigate to results
        if (gameState === 'FINISHED') {
          navigate(`/play/${sessionId}/results`);
          return;
        }
        // If question has changed, reset selected answers
        if (currentQuestion && (!selectedAnswers.length || selectedAnswers[0].questionId !== currentQuestion.id)) {
          setSelectedAnswers([]);
          setShowResults(false);
        }

        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch game state');
        setIsLoading(false);
      }
    };
    // Initial poll
    pollGameState();
    // Set up polling interval
    const interval = setInterval(pollGameState, 1000);
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [sessionId, selectedAnswers, navigate]);
  // Handle answer selection
  const handleAnswerSelect = async (answerId) => {
    if (showResults || timeLeft <= 0) return;
    try {
      // For single choice questions, replace the selection
      if (currentQuestion.type === 'SINGLE') {
        setSelectedAnswers([{ questionId: currentQuestion.id, answerId }]);
      } 
      // For multiple choice questions, toggle the selection
      else if (currentQuestion.type === 'MULTIPLE') {
        setSelectedAnswers(prev => {
          const exists = prev.find(a => a.answerId === answerId);
          if (exists) {
            return prev.filter(a => a.answerId !== answerId);
          }
          return [...prev, { questionId: currentQuestion.id, answerId }];
        });
      }
      // Send answer to server
      await axios.post(`http://localhost:5005/play/${sessionId}/answer`, {
        playerId,
        questionId: currentQuestion.id,
        answerId
      });
    } catch (err) {
      setError('Failed to submit answer');
    }
  };
  // Render waiting screen
  if (gameState === 'WAITING') {
    return (
      <Container className="mt-5 text-center">
        <Card className="mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <Card.Title>Please Wait</Card.Title>
            <Card.Text>The game will start soon...</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  // Render loading state
  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Card className="mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <Card.Title>Loading...</Card.Title>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  // Render error state
  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  // Render game screen
  return (
    <Container className="mt-4">
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Question {currentQuestion?.number}</Card.Title>
          <Card.Text>{currentQuestion?.text}</Card.Text>
          
          {/* Display media if available */}
          {currentQuestion?.media && (
            <div className="mb-3">
              {currentQuestion.media.type === 'image' ? (
                <img 
                  src={currentQuestion.media.url} 
                  alt="Question media" 
                  className="img-fluid"
                  style={{ maxHeight: '300px' }}
                />
              ) : (
                <video 
                  src={currentQuestion.media.url} 
                  controls 
                  className="w-100"
                  style={{ maxHeight: '300px' }}
                />
              )}
            </div>
          )}
          {/* Timer */}
          <div className="mb-3">
            <h3>Time Left: {timeLeft} seconds</h3>
          </div>
          {/* Answer options */}
          {!showResults && (
            <div className="d-grid gap-2">
              {currentQuestion?.answers.map(answer => (
                <Button
                  key={answer.id}
                  variant={selectedAnswers.find(a => a.answerId === answer.id) ? 'primary' : 'outline-primary'}
                  onClick={() => handleAnswerSelect(answer.id)}
                  disabled={timeLeft <= 0}
                >
                  {answer.text}
                </Button>
              ))}
            </div>
          )}
          {/* Results display */}
          {showResults && currentQuestion?.results && (
            <div className="mt-3">
              <h4>Results</h4>
              {currentQuestion.results.map(result => (
                <div key={result.answerId} className="mb-2">
                  <strong>{result.answerText}:</strong> {result.percentage}%
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default GameScreen; 