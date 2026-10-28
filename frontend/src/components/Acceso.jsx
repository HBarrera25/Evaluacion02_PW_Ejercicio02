import React, { useState } from 'react';
import { Alert, Button, Card, CardBody, Form, FormGroup, Input, Label } from 'reactstrap';
import { autenticarUsuario } from '../services/api.js';
import Logo from './Logo.jsx';

export default function Acceso({ onIngresar }) {
  const [registro, setRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);
  async function enviar(evento) {
    evento.preventDefault();
    if (procesando) return;
    setProcesando(true);
    setError('');
    try {
      const resultado = await autenticarUsuario(registro ? 'registro' : 'ingresar', { nombre, nombreUsuario, password });
      setPassword('');
      await onIngresar(resultado.usuario);
    } catch (e) { setError(e.message); }
    finally { setProcesando(false); }
  }
  return <div className="p-3">
    <Card className="mx-auto acceso-card"><CardBody className="p-4 p-md-5">
      <Logo />
      <h2 className="h3 mt-3">{registro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h2>
      <p className="text-secondary">{registro ? 'Disfruta de FOOD DEI, lo mejor en almuerzos.' : 'Ingresa para preparar tu reserva.'}</p>
      {error && <Alert color="warning" role="alert">{error}</Alert>}
      <Form onSubmit={enviar}>
        {registro && <FormGroup><Label for="registro-nombre">Tu nombre</Label>
          <Input id="registro-nombre" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} minLength={2} maxLength={100} required disabled={procesando} />
        </FormGroup>}
        <FormGroup><Label for="acceso-usuario">Nombre de usuario</Label>
          <Input id="acceso-usuario" autoComplete="username" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]{3,30}" required disabled={procesando} aria-describedby="usuario-ayuda" />
          <small id="usuario-ayuda" className="text-secondary">De 3 a 30 letras sin tildes, números o guion bajo.</small>
        </FormGroup>
        <FormGroup><Label for="acceso-password">Contraseña</Label>
          <Input id="acceso-password" type="password" autoComplete={registro ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={128} required disabled={procesando} />
          {registro && <small className="text-secondary">Al menos 8 caracteres.</small>}
        </FormGroup>
        <Button type="submit" color="primary" block disabled={procesando}>{procesando ? 'Cargando...' : registro ? 'Crear cuenta' : 'Iniciar sesión'}</Button>
      </Form>
      <Button color="link" className="px-0 mt-3" disabled={procesando} onClick={() => { setRegistro(!registro); setError(''); setPassword(''); }}>
        {registro ? 'Ya tengo cuenta. Iniciar sesión' : 'Soy nuevo. Crear una cuenta'}
      </Button>
    </CardBody></Card>
  </div>;
}
