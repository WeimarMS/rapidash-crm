import type { DictModule } from './core'

// Claves de la página Usuarios. Namespace: 'usuarios.*'
export const usuarios: DictModule = {
  es: {
    'usuarios.title':       'Usuarios',
    'usuarios.invite':      'Invitar por email',
    'usuarios.new':         'Nuevo usuario',

    // ── Stats ──
    'usuarios.stats.total':   'Total usuarios',
    'usuarios.stats.activos': 'Activos',
    'usuarios.stats.admins':  'Administradores',
    'usuarios.stats.inactivos':'Inactivos',

    // ── Tabla ──
    'usuarios.count':         '{count} usuario del sistema',
    'usuarios.count.plural':  '{count} usuarios del sistema',
    'usuarios.th.usuario':       'Usuario',
    'usuarios.th.nombreCompleto':'Nombre completo',
    'usuarios.th.rol':           'Rol',
    'usuarios.th.zona':          'Zona',
    'usuarios.th.registrado':    'Registrado',
    'usuarios.th.estado':        'Estado',
    'usuarios.registradoMobile': 'Registrado: {date}',

    // ── Estados ──
    'usuarios.estado.invitado': 'Invitado',
    'usuarios.estado.activo':   'Activo',
    'usuarios.estado.inactivo': 'Inactivo',

    // ── Acciones fila ──
    'usuarios.self':       'Tu cuenta',
    'usuarios.changeRole': 'Cambiar rol',

    'usuarios.empty': 'Sin usuarios del sistema. Crea el primero con "+ Nuevo usuario".',

    // ── Modales ──
    'usuarios.modal.eyebrow':    'Usuarios',
    'usuarios.modal.new.title':       'Nuevo usuario',
    'usuarios.modal.invite.title':    'Invitar por email',
    'usuarios.modal.changeRole.title':'Cambiar rol',

    // ── Labels ──
    'usuarios.label.usuario':    'Usuario *',
    'usuarios.label.nombre':     'Nombre *',
    'usuarios.label.apellido':   'Apellido *',
    'usuarios.label.password':   'Contraseña *',
    'usuarios.label.passwordHint':'(mín. 8 caracteres)',
    'usuarios.label.email':      'Email *',
    'usuarios.label.rol':        'Rol *',
    'usuarios.label.zona':       'Zona *',

    'usuarios.noZona':       'Este rol no requiere zona',
    'usuarios.invite.hint':  'Le llegará un correo para que defina su propia contraseña. Su rol queda asignado desde ahora.',

    // ── Botones ──
    'usuarios.btn.create':    'Crear usuario',
    'usuarios.btn.creating':  'Creando…',
    'usuarios.btn.invite':    'Enviar invitación',
    'usuarios.btn.inviting':  'Enviando…',

    // ── Errores de validación ──
    'usuarios.err.required':      'Todos los campos marcados con * son obligatorios',
    'usuarios.err.passwordLen':   'La contraseña debe tener al menos 8 caracteres',
    'usuarios.err.zonaRequired':  'Selecciona una zona para este rol',
    'usuarios.err.inviteRequired':'Email, nombre y apellido son obligatorios',

    // ── Toasts ──
    'usuarios.toast.created':     'Usuario {name} creado correctamente',
    'usuarios.toast.invited':     'Invitación enviada a {email}',
    'usuarios.toast.roleUpdated': 'Rol de {name} actualizado a {role}',
    'usuarios.toast.deactivated': '{name} desactivado',
    'usuarios.toast.activated':   '{name} activado',
  },
  en: {
    'usuarios.title':       'Users',
    'usuarios.invite':      'Invite by email',
    'usuarios.new':         'New user',

    // ── Stats ──
    'usuarios.stats.total':   'Total users',
    'usuarios.stats.activos': 'Active',
    'usuarios.stats.admins':  'Administrators',
    'usuarios.stats.inactivos':'Inactive',

    // ── Table ──
    'usuarios.count':         '{count} system user',
    'usuarios.count.plural':  '{count} system users',
    'usuarios.th.usuario':       'User',
    'usuarios.th.nombreCompleto':'Full name',
    'usuarios.th.rol':           'Role',
    'usuarios.th.zona':          'Zone',
    'usuarios.th.registrado':    'Registered',
    'usuarios.th.estado':        'Status',
    'usuarios.registradoMobile': 'Registered: {date}',

    // ── Statuses ──
    'usuarios.estado.invitado': 'Invited',
    'usuarios.estado.activo':   'Active',
    'usuarios.estado.inactivo': 'Inactive',

    // ── Row actions ──
    'usuarios.self':       'Your account',
    'usuarios.changeRole': 'Change role',

    'usuarios.empty': 'No system users. Create the first one with "+ New user".',

    // ── Modals ──
    'usuarios.modal.eyebrow':    'Users',
    'usuarios.modal.new.title':       'New user',
    'usuarios.modal.invite.title':    'Invite by email',
    'usuarios.modal.changeRole.title':'Change role',

    // ── Labels ──
    'usuarios.label.usuario':    'User *',
    'usuarios.label.nombre':     'First name *',
    'usuarios.label.apellido':   'Last name *',
    'usuarios.label.password':   'Password *',
    'usuarios.label.passwordHint':'(min. 8 characters)',
    'usuarios.label.email':      'Email *',
    'usuarios.label.rol':        'Role *',
    'usuarios.label.zona':       'Zone *',

    'usuarios.noZona':       'This role does not require a zone',
    'usuarios.invite.hint':  'They will receive an email to set their own password. Their role is assigned from now on.',

    // ── Buttons ──
    'usuarios.btn.create':    'Create user',
    'usuarios.btn.creating':  'Creating…',
    'usuarios.btn.invite':    'Send invitation',
    'usuarios.btn.inviting':  'Sending…',

    // ── Validation errors ──
    'usuarios.err.required':      'All fields marked with * are required',
    'usuarios.err.passwordLen':   'The password must be at least 8 characters long',
    'usuarios.err.zonaRequired':  'Select a zone for this role',
    'usuarios.err.inviteRequired':'Email, first name and last name are required',

    // ── Toasts ──
    'usuarios.toast.created':     'User {name} created successfully',
    'usuarios.toast.invited':     'Invitation sent to {email}',
    'usuarios.toast.roleUpdated': 'Role of {name} updated to {role}',
    'usuarios.toast.deactivated': '{name} deactivated',
    'usuarios.toast.activated':   '{name} activated',
  },
}
