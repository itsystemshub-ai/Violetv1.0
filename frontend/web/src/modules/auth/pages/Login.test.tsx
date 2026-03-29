import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../src/modules/auth/pages/Login';

describe('Login Page', () => {
  const renderLogin = () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('should render login form', () => {
    renderLogin();
    
    expect(screen.getByPlaceholderText(/correo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contrase/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar/i })).toBeInTheDocument();
  });

  it('should show demo credentials', () => {
    renderLogin();
    
    expect(screen.getByText(/admin@violet-erp.com/i)).toBeInTheDocument();
    expect(screen.getByText(/admin123/i)).toBeInTheDocument();
  });
});
