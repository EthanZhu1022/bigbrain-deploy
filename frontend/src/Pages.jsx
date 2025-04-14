import { useState, useEffect } from 'react';
import axios from 'axios';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";

function Pages() {
  const [token,setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  },[]);

  const successJob = (token) => {
    localStorage.setItem('token', token);
    setToken(token);
    navigate('/dashboard');
  }

  const logout = async () => {
    try{
      const response = await axios.post('http://localhost:5005/admin/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      localStorage.removeItem('token');
      setToken(null);
      navigate('/login');
    } catch (err){
      alert(err.response.data.error || 'Registration failed');
    }
  };

  if (loading) return null;

  return(
    <>
      {token ?(
        <>
        <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
        <Link to="/login">Login</Link>
        &nbsp;|&nbsp;
        <Link to="/register">Register</Link>
        </>
      )}
      <hr />
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/register" element={<Register token={token} successJob={successJob} />} />
        <Route path="/login" element={<Login token={token} successJob={successJob} />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  )
}

export default Pages;
