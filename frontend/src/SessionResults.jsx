import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Table, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * SessionResults Component
 * 
 * Displays and manages the results of a game session, including:
 * - Top 5 players and their scores
 * - Question success rate chart
 * - Average response time chart
 * - Ability to advance or stop the session
 */
function SessionResults({ token }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [sessionStatus, setSessionStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch session status and results
  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  /**
   * Fetches session status and results from the server
   */
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      // Get session status
      const statusResponse = await axios.get(`http://localhost:5005/admin/session/${sessionId}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSessionStatus(statusResponse.data);

      // Get session results if the session is finished
      if (!statusResponse.data.active) {
        const resultsResponse = await axios.get(`http://localhost:5005/admin/session/${sessionId}/results`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setResults(resultsResponse.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch session data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Advances the game to the next question
   */
  const advanceGame = async () => {
    try {
      await axios.post(`http://localhost:5005/admin/game/${sessionStatus.gameId}/mutate`, {
        mutationType: 'ADVANCE'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchSessionData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to advance game');
    }
  };

  /**
   * Stops the game session
   */
  const stopGame = async () => {
    try {
      await axios.post(`http://localhost:5005/admin/game/${sessionStatus.gameId}/mutate`, {
        mutationType: 'END'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchSessionData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to stop game');
    }
  };

  /**
   * Prepares data for the question success rate chart
   */
  const getSuccessRateData = () => {
    if (!results) return null;

    const questionData = results.reduce((acc, player) => {
      player.answers.forEach((answer, index) => {
        if (!acc[index]) {
          acc[index] = { correct: 0, total: 0 };
        }
        acc[index].total++;
        if (answer.correct) {
          acc[index].correct++;
        }
      });
      return acc;
    }, {});

    return {
      labels: Object.keys(questionData).map(i => `Question ${parseInt(i) + 1}`),
      datasets: [{
        label: 'Success Rate (%)',
        data: Object.values(questionData).map(d => (d.correct / d.total) * 100),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
  };

  /**
   * Prepares data for the average response time chart
   */
  const getResponseTimeData = () => {
    if (!results) return null;

    const questionData = results.reduce((acc, player) => {
      player.answers.forEach((answer, index) => {
        if (!acc[index]) {
          acc[index] = { totalTime: 0, count: 0 };
        }
        const startTime = new Date(answer.questionStartedAt);
        const endTime = new Date(answer.answeredAt);
        acc[index].totalTime += (endTime - startTime) / 1000; // Convert to seconds
        acc[index].count++;
      });
      return acc;
    }, {});

    return {
      labels: Object.keys(questionData).map(i => `Question ${parseInt(i) + 1}`),
      datasets: [{
        label: 'Average Response Time (seconds)',
        data: Object.values(questionData).map(d => d.totalTime / d.count),
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    };
  };

  if (loading) return <Container className="mt-4">Loading...</Container>;
  if (error) return <Container className="mt-4">Error: {error}</Container>;

  return (
    <Container className="mt-4">
      <h2>Session Results</h2>
      
      {/* Game Controls */}
      {sessionStatus.active && (
        <div className="mb-4">
          <Button variant="primary" onClick={advanceGame} className="me-2">
            Advance to Next Question
          </Button>
          <Button variant="danger" onClick={stopGame}>
            Stop Game
          </Button>
        </div>
      )}

      {/* Top Players Table */}
      {results && (
        <Card className="mb-4">
          <Card.Header>Top 5 Players</Card.Header>
          <Card.Body>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 5)
                  .map((player, index) => (
                    <tr key={player.id}>
                      <td>{index + 1}</td>
                      <td>{player.name}</td>
                      <td>{player.score}</td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Charts */}
      {results && (
        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Question Success Rate</Card.Header>
              <Card.Body>
                <Bar data={getSuccessRateData()} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>Average Response Time</Card.Header>
              <Card.Body>
                <Line data={getResponseTimeData()} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default SessionResults; 