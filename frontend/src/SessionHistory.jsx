import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Table, Button } from "react-bootstrap";
import axios from "axios";

function SessionHistory() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const sessionMap = JSON.parse(localStorage.getItem("sessionMap") || "{}");
    const localSessions = sessionMap[gameId] || [];

    const fetchSessionMeta = async () => {
      const fetched = await Promise.all(
        localSessions.map(async (id) => {
          try {
            const res = await axios.get(
              `https://bigbrain-backend-qff3.onrender.com/admin/session/${id}/status`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            const session = res.data.results;
            if (!session.active) {
              return {
                id,
                createdAt:
                  session.isoTimeLastQuestionStarted ||
                  new Date().toISOString(),
              };
            }
            return null;
          } catch (err) {
            void err;
            return null;
          }
        })
      );

      const filteredSorted = fetched
        .filter((s) => s !== null && s !== undefined)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSessions(filteredSorted);
    };

    fetchSessionMeta();
  }, [gameId, token]);

  return (
    <Container className="mt-4">
      <h2>Past Sessions for Game {gameId}</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session, idx) => (
            <tr key={idx}>
              <td>{session.id}</td>
              <td>{new Date(session.createdAt).toLocaleString()}</td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/session/${session.id}`)}
                >
                  View Results
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button variant="secondary" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </Button>
    </Container>
  );
}

export default SessionHistory;
