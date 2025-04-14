import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({successJob, token}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    if(token){
        navigate('/dashboard');
    }

    const login = async () => {
        if (email === '') {
            alert('Please enter email');
            return;
        }

        if (password === '') {
            alert('Please enter password');
            return;
        } 
        
        try{
            const response = await axios.post('http://localhost:5005/admin/auth/login', {
                email: email,
                password: password,
            });
            const token = response.data.token;
            successJob(token);
        } catch (err){
            alert(err.response.data.error || 'Registration failed');
        }
    }      

    return (
        <>
            <h1>Login</h1>
            Email:<input value={email} onChange={e => setEmail(e.target.value)} type='text' /><br />
            Password:<input value={password} onChange={e => setPassword(e.target.value)} type='text' /><br />
            <button onClick={login}>Login</button>
        </>
    )
}

export default Login;
