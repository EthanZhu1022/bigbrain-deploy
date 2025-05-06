import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Form, Button, Card, Container } from "react-bootstrap";

function Login({ successJob, token, showToast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  if (token) {
    navigate("/dashboard");
  }

  const login = async () => {
    if (email === "") {
      showToast("Please enter email", "danger");
      return;
    }
    if (password === "") {
      showToast("Please enter password", "danger");
      return;
    }
    try {
      const response = await axios.post(
        "https://bigbrain-backend-qff3.onrender.com/admin/auth/login",
        {
          email: email,
          password: password,
        }
      );
      const token = response.data.token;
      successJob(token);
    } catch (err) {
      showToast(err.response?.data?.error || "Login failed", "danger");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card className="w-75">
        <Card.Body>
          <h2 className="text-center mb-4">Login</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Login
            </Button>
          </Form>
          <div className="text-center text-muted small">
            Don&apos;t have an account?&nbsp;Try&nbsp;
            <Button
              variant="link"
              className="p-0 ms-1"
              onClick={() => navigate("/register")}
            >
              Register!
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;

