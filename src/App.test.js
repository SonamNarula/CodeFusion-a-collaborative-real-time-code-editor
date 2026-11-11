import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the CodeFusion sign-in screen', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter CodeFusion →' })).toBeInTheDocument();
});
