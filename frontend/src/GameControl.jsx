import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Button, Card, ListGroup, Alert } from 'react-bootstrap';
import axios from 'axios';

function GameControl({ token, showToast }) {
  const navigate = useNavigate();
  const { gameId, sessionId } = useParams();

  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSessionInfo = async () => {
    try {
        const res = await axios.get(`http://localhost:5005/admin/session/${sessionId}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      setSessionInfo(res.data.results);
    } catch (err) {
      showToast && showToast('Failed to load session info', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    try {
      await axios.post(`http://localhost:5005/admin/game/${gameId}/mutate`, {
        mutationType: 'ADVANCE',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast && showToast('Advanced to next question', 'success');
  
      const res = await axios.get(`http://localhost:5005/admin/session/${sessionId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      const updatedSession = res.data.results;
      setSessionInfo(updatedSession);
  
      const newPosition = updatedSession?.position ?? -1;
      const total = updatedSession?.questions?.length ?? 0;
  
      if (updatedSession?.active === false || newPosition + 1 > total) {
        showToast && showToast('Game has ended', 'info');
        navigate(`/session/${sessionId}`);
      }
    } catch (err) {
      showToast && showToast('Failed to advance question', 'danger');
    }
  };  

  const handleEndGame = async () => {
    try {
      await axios.post(`http://localhost:5005/admin/game/${gameId}/mutate`, {
        mutationType: 'END',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast && showToast('Game ended', 'warning');
      navigate(`/session/${sessionId}`);
    } catch (err) {
      showToast && showToast('Failed to end game', 'danger');
    }
  };  

  const handleBack = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    fetchSessionInfo();
    const interval = setInterval(fetchSessionInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const position = sessionInfo?.position ?? -1;
  const totalQuestions = sessionInfo?.questions?.length ?? 0;
  const gameEnded = sessionInfo?.active === false;
  const currentQuestion = sessionInfo?.questions?.[position];
  const playerNames = sessionInfo?.players ?? [];

  return (
    <Container className="mt-4 text-center">
      <h2>Game Control Page</h2>

      {!loading && (
        <>
          <p>
            {gameEnded
              ? 'Game has ended.'
              : position === -1
                ? 'Not started yet'
                : `Currently on Question ${position + 1} / ${totalQuestions}`}
          </p>

          <Button variant="primary" onClick={handleBack} className="me-3">
            Back to Dashboard
          </Button>

          {!gameEnded && (
            <>
              <Button variant="success" onClick={handleNextQuestion} className="me-2">
                {position === -1 ? 'Start First Question' : 'Next Question'}
              </Button>
              {position >= 0 && (
                <Button variant="danger" onClick={handleEndGame}>
                  End Game
                </Button>
              )}
            </>
          )}

          {currentQuestion && (
            <Card className="mt-4 text-start">
              <Card.Header>Current Question</Card.Header>
              <Card.Body>
                <Card.Text><strong>Q:</strong> {currentQuestion.question}</Card.Text>
                <ListGroup variant="flush">
                  {currentQuestion.answers.map((ans, idx) => (
                    <ListGroup.Item key={idx}>
                      {String.fromCharCode(65 + idx)}. {ans.text}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}

          {playerNames.length > 0 && (
            <Card className="mt-4 text-start">
              <Card.Header>Players Joined</Card.Header>
              <ListGroup variant="flush">
                {playerNames.map((name, idx) => (
                  <ListGroup.Item key={idx}>{name}</ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          )}
        </>
      )}
    </Container>
  );
}

export default GameControl;