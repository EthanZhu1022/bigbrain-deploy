import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import axios from 'axios';

function GameScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const playerId = localStorage.getItem('playerId');
  const playerName = localStorage.getItem('playerName');

  useEffect(() => {
    if (!playerId || !playerName) {
      navigate(`/play/${sessionId}`);
    }
  }, [playerId, playerName, sessionId, navigate]);

  useEffect(() => {
    const pollGameState = async () => {
      try {
        const response = await axios.get(`http://localhost:5005/play/${playerId}/status`);
        const { gameState, currentQuestion, timeLeft } = response.data;
        setGameState(gameState);
        setTimeLeft(timeLeft);

        if (gameState === 'WAITING') {
          setIsLoading(false);
          return;
        }

        if (gameState === 'FINISHED') {
          navigate(`/play/${sessionId}/results`);
          return;
        }

        if (currentQuestion && (!selectedAnswers.length || selectedAnswers[0].questionId !== currentQuestion.id)) {
          setSelectedAnswers([]);
          setShowResults(false);
        }

        setCurrentQuestion(currentQuestion);
        setIsLoading(false);

        if (timeLeft <= 0) {
          setShowResults(true);
        }
      } catch (err) {
        setError('Failed to fetch game state');
        setIsLoading(false);
      }
    };

    pollGameState();
    const interval = setInterval(pollGameState, 1000);
    return () => clearInterval(interval);
  }, [sessionId, playerId, selectedAnswers, navigate]);

  const handleAnswerSelect = async (answerId) => {
    if (showResults || timeLeft <= 0) return;

    try {
      if (currentQuestion.type === 'SINGLE' || currentQuestion.type === 'JUDGEMENT') {
        setSelectedAnswers([{ questionId: currentQuestion.id, answerId }]);
        await axios.put(`http://localhost:5005/play/${playerId}/answer`, {
          questionId: currentQuestion.id,
          answerId,
        });
      } else if (currentQuestion.type === 'MULTIPLE') {
        setSelectedAnswers(prev => {
          const exists = prev.find(a => a.answerId === answerId);
          let newAnswers;
          if (exists) {
            newAnswers = prev.filter(a => a.answerId !== answerId);
          } else {
            newAnswers = [...prev, { questionId: currentQuestion.id, answerId }];
          }

          newAnswers.forEach(async ans => {
            await axios.put(`http://localhost:5005/play/${playerId}/answer`, {
              questionId: currentQuestion.id,
              answerId: ans.answerId,
            });
          });

          return newAnswers;
        });
      }
    } catch (err) {
      setError('Failed to submit answer');
    }
  };

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

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Question {currentQuestion?.number}</Card.Title>
          <Card.Text>{currentQuestion?.text}</Card.Text>

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

          <div className="mb-3">
            <h3>Time Left: {timeLeft} seconds</h3>
          </div>

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