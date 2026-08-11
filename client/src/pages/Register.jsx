import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, UserRound } from 'lucide-react';
import Button from '../components/Button/index.jsx';
import Input from '../components/Input/index.jsx';
import useAuth from '../hooks/useAuth.jsx';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('Emma Blake');
  const [email, setEmail] = useState('emma@prioritypulse.com');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await register({ name, email });
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input label="Full name" icon={UserRound} type="text" placeholder="Your full name" value={name} onChange={(event) => setName(event.target.value)} required />
      <Input label="Email address" icon={Mail} type="email" placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <Input label="Password" icon={Lock} type="password" placeholder="Create a password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      <Button type="submit" variant="primary" icon={ArrowRight} iconPosition="right" className="w-full py-3">
        Create account
      </Button>
      <p className="text-center text-sm text-[color:var(--text-muted)]">
        Already have an account?{' '}
        <a href="/login" className="font-semibold text-[color:var(--ember)] hover:brightness-110">
          Sign in
        </a>
      </p>
    </form>
  );
}

export default Register;
