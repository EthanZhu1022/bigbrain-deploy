import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register({successJob, token}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const navigate = useNavigate();

    if(token){
        navigate('/dashboard');
    }

    const register = async () => {
        if (password !== passwordConfirm) {
            alert('Passwords dont match');
            return;
        } 
        
        try{
            const response = await axios.post('http://localhost:5005/admin/auth/register', {
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
            <h1>Register</h1>
            Email:<input value={email} onChange={e => setEmail(e.target.value)} type='text' /><br />
            Password:<input value={password} onChange={e => setPassword(e.target.value)} type='text' /><br />
            PasswordConfirm:<input value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} type='text' /><br />
            <button onClick={register}>Register</button>
        </>
    )
}

export default Register;
