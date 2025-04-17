import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container } from 'react-bootstrap';

function Register({ successJob, token, showToast }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const navigate = useNavigate();

  if(token){
    navigate('/dashboard');
  }

  const register = async () => {
    if (name === '') {
      showToast('Please enter name', 'danger');
      return;
    }
    if (email === '') {
      showToast('Please enter email', 'danger');
      return;
    }
    if (!email.match(/^\S+@\S+\.\S+$/)) {
      showToast('Wrong email format', 'danger');
      return;
    }
    if (password === '') {
      showToast('Please enter password', 'danger');
      return;
    } 
    if (password !== passwordConfirm) {
      showToast('Passwords do not match', 'danger');
      return;
    } 
    try{
      const response = await axios.post('http://localhost:5005/admin/auth/register', {
        email: email,
        password: password,
        name: name,
      });
      const token = response.data.token;
      showToast('Registration successful', 'success');
      successJob(token);
    } catch (err){
      showToast(err.response?.data?.error || 'Registration failed', 'danger');
    }
  }

  return (
    <Container className="d-flex justify-content-center align-items-center login-page" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Register</h2>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="name" value={name} onChange={e => setName(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
            </Form.Group>
            <Button variant="success" onClick={register} className="w-100">Register</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Register;
