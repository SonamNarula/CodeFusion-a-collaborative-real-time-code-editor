import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the CodeFusion sign-in screen', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'CodeFusion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in & enter' })).toBeInTheDocument();
});
