// Panel de Admin: gestión de usuarios. Solo se muestra a rol admin (App.jsx),
// y el backend igual responde 403 a cualquier otro rol.
import { useState } from 'react';
import * as adminApi from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../lib/useFetch';
import { Badge, Button, Card, Field, FormError, inputClass } from '../components/ui/Primitives';
import { Dropdown } from '../components/ui/Dropdown';
import { Icon } from '../components/ui/Icon';
import { Loadable } from '../components/ui/States';
import { Modal } from '../components/ui/Modal';

const ROLES = [
  { value: 'operador', label: 'Operador' },
  { value: 'admin', label: 'Admin' },
];

function RolBadge({ rol }) {
  return rol === 'admin'
    ? <Badge className="bg-flox-100 text-flox-700">Admin</Badge>
    : <Badge className="bg-slate-100 text-slate-700">Operador</Badge>;
}

function EstadoLabel({ activo }) {
  return activo
    ? <span className="text-sm font-semibold text-emerald-700">● Activo</span>
    : <span className="text-sm font-semibold text-slate-400">● Desactivado</span>;
}

function Resumen({ usuarios }) {
  const items = [
    { label: 'Usuarios activos', valor: usuarios.filter((u) => u.activo).length },
    { label: 'Administradores', valor: usuarios.filter((u) => u.activo && u.rol === 'admin').length },
    { label: 'Desactivados', valor: usuarios.filter((u) => !u.activo).length },
  ];
  return (
    <div className="escalonado grid grid-cols-3 gap-3 sm:gap-4">
      {items.map((i) => (
        <Card key={i.label} className="p-3.5 sm:p-5">
          <div className="text-xs sm:text-sm text-slate-500">{i.label}</div>
          <div className="font-display font-extrabold text-2xl sm:text-3xl mt-1 tabular-nums">{i.valor}</div>
        </Card>
      ))}
    </div>
  );
}

// Botones de cada usuario. En el propio admin solo "Editar" (nombre/email):
// no puede desactivarse, eliminarse ni quitarse el rol (el backend también lo bloquea).
function Acciones({ usuario, esYo, onChanged, onError, onEliminar, onEditar, onPassword, className = '' }) {
  const [busy, setBusy] = useState(false);
  if (esYo) {
    return (
      <div className={'flex items-center gap-3 ' + className}>
        <span className="text-sm text-slate-400">Tu usuario</span>
        <Button variant="outline" onClick={() => onEditar(usuario)}>Editar</Button>
      </div>
    );
  }

  const toggle = async () => {
    setBusy(true);
    onError(null);
    try {
      await adminApi.cambiarEstado(usuario.id, !usuario.activo);
      onChanged();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={'grid grid-cols-2 gap-2 md:flex ' + className}>
      <Button variant="outline" disabled={busy} onClick={() => onEditar(usuario)}>Editar</Button>
      <Button variant="outline" disabled={busy} onClick={() => onPassword(usuario)}>Contraseña</Button>
      <Button variant="outline" disabled={busy} onClick={toggle}>
        {usuario.activo ? 'Desactivar' : 'Reactivar'}
      </Button>
      <Button variant="dangerOutline" disabled={busy} onClick={() => onEliminar(usuario)}>
        Eliminar
      </Button>
    </div>
  );
}

function NuevoUsuarioModal({ onClose, onDone }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'operador' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    setSaving(true);
    try {
      await adminApi.crearUsuario(form);
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Nuevo usuario"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="nuevo-usuario" className="flex-1" disabled={saving}>
            {saving ? 'Creando…' : 'Crear usuario'}
          </Button>
        </div>
      }
    >
      <form id="nuevo-usuario" onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">Le das una contraseña inicial y después la puede cambiar.</p>
        <Field label="Nombre">
          <input className={inputClass} value={form.nombre} onChange={set('nombre')} placeholder="Ej: Mamá" required maxLength={100} />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={form.email} onChange={set('email')} placeholder="nombre@correo.com" required autoComplete="off" />
        </Field>
        <Field label="Contraseña inicial">
          <input className={inputClass} type="password" value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Rol">
          <Dropdown value={form.rol} onChange={(rol) => setForm((f) => ({ ...f, rol }))} opciones={ROLES} />
        </Field>
        <FormError message={error} />
      </form>
    </Modal>
  );
}

// Editar nombre, email y rol. En el propio usuario el rol queda fijo.
function EditarModal({ usuario, esYo, onClose, onDone }) {
  const [form, setForm] = useState({ nombre: usuario.nombre, email: usuario.email, rol: usuario.rol });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await adminApi.actualizarUsuario(usuario.id, form);
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Editar usuario"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="editar-usuario" className="flex-1" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      }
    >
      <form id="editar-usuario" onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nombre">
          <input className={inputClass} value={form.nombre} onChange={set('nombre')} required maxLength={100} />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={form.email} onChange={set('email')} required autoComplete="off" />
        </Field>
        <Field label="Rol">
          <Dropdown value={form.rol} onChange={(rol) => setForm((f) => ({ ...f, rol }))} opciones={ROLES} disabled={esYo} />
        </Field>
        {esYo && <p className="text-sm text-slate-500 -mt-2">No podés cambiar tu propio rol.</p>}
        <FormError message={error} />
      </form>
    </Modal>
  );
}

// Resetear la contraseña (ej. si se la olvidó). Pide la nueva dos veces.
function PasswordModal({ usuario, onClose }) {
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [listo, setListo] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (password !== confirmacion) return setError('Las contraseñas no coinciden');
    setSaving(true);
    try {
      await adminApi.resetearPassword(usuario.id, password);
      setListo(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Resetear contraseña"
      onClose={onClose}
      footer={
        listo ? (
          <Button className="w-full" onClick={onClose}>Listo</Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" form="resetear-password" className="flex-1" disabled={saving}>
              {saving ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        )
      }
    >
      {listo ? (
        <p role="status" className="text-sm">
          Listo: <strong>{usuario.nombre}</strong> ya puede entrar con la contraseña nueva. Pasásela por un medio seguro.
        </p>
      ) : (
        <form id="resetear-password" onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">
            Nueva contraseña para <strong>{usuario.nombre}</strong> ({usuario.email}).
          </p>
          <Field label="Nueva contraseña">
            <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="Repetí la contraseña">
            <input className={inputClass} type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required autoComplete="new-password" />
          </Field>
          <FormError message={error} />
        </form>
      )}
    </Modal>
  );
}

// Confirmación en pantalla antes de eliminar (acción definitiva).
function EliminarModal({ usuario, onClose, onDone }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const confirmar = async () => {
    setBusy(true);
    setError(null);
    try {
      await adminApi.eliminarUsuario(usuario.id);
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Eliminar usuario"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" className="flex-1" disabled={busy} onClick={confirmar}>
            {busy ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-sm">
        <p>
          ¿Eliminar a <strong>{usuario.nombre}</strong> ({usuario.email})? No va a poder volver a entrar y
          esto <strong>no se puede deshacer</strong>.
        </p>
        <p className="text-slate-500">
          Si solo querés que deje de entrar por un tiempo, usá <strong>Desactivar</strong>: se puede reactivar después.
        </p>
        <FormError message={error} />
      </div>
    </Modal>
  );
}

export default function UsuariosPage() {
  const { usuario: yo } = useAuth();
  const state = useFetch(() => adminApi.listarUsuarios(), []);
  const [nuevo, setNuevo] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [aEditar, setAEditar] = useState(null);
  const [aResetear, setAResetear] = useState(null);
  const [error, setError] = useState(null);
  const acciones = { onChanged: state.reload, onError: setError, onEliminar: setAEliminar, onEditar: setAEditar, onPassword: setAResetear };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">Administrá quién entra a Floxer y con qué rol.</p>
        </div>
        <Button onClick={() => setNuevo(true)}><Icon.plus className="w-4 h-4" aria-hidden="true" /> Nuevo usuario</Button>
      </header>

      <FormError message={error} />

      <Loadable state={state}>
        {(usuarios) => (
          <>
            <Resumen usuarios={usuarios} />

            {/* Celular: tarjetas */}
            <div className="escalonado flex flex-col gap-3 md:hidden">
              {usuarios.map((u) => (
                <Card key={u.id} className={'p-4 flex flex-col gap-3 ' + (u.activo ? '' : 'opacity-75')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{u.nombre}</div>
                      <div className="text-sm text-slate-500 truncate">{u.email}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <EstadoLabel activo={u.activo} />
                      <RolBadge rol={u.rol} />
                    </div>
                  </div>
                  <Acciones usuario={u} esYo={u.id === yo.id} {...acciones} />
                </Card>
              ))}
            </div>

            {/* Escritorio: tabla */}
            <Card className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="px-5 py-4 font-semibold">Nombre</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Rol</th>
                    <th className="px-5 py-4 font-semibold">Estado</th>
                    <th className="px-5 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="escalonado">
                  {usuarios.map((u) => (
                    <tr key={u.id} className={'border-b border-slate-100 last:border-b-0 ' + (u.activo ? '' : 'opacity-75')}>
                      <td className="px-5 py-3 font-semibold">{u.nombre}</td>
                      <td className="px-5 py-3">{u.email}</td>
                      <td className="px-5 py-3"><RolBadge rol={u.rol} /></td>
                      <td className="px-5 py-3"><EstadoLabel activo={u.activo} /></td>
                      <td className="px-5 py-3">
                        <Acciones usuario={u} esYo={u.id === yo.id} {...acciones} className="justify-end" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <p className="text-sm text-slate-500">
              <strong>Desactivar</strong> le corta el acceso y conserva su historial (se puede reactivar).{' '}
              <strong>Eliminar</strong> lo quita del sistema definitivamente.
            </p>
          </>
        )}
      </Loadable>

      {nuevo && <NuevoUsuarioModal onClose={() => setNuevo(false)} onDone={state.reload} />}
      {aEditar && <EditarModal usuario={aEditar} esYo={aEditar.id === yo.id} onClose={() => setAEditar(null)} onDone={state.reload} />}
      {aResetear && <PasswordModal usuario={aResetear} onClose={() => setAResetear(null)} />}
      {aEliminar && <EliminarModal usuario={aEliminar} onClose={() => setAEliminar(null)} onDone={state.reload} />}
    </div>
  );
}
