import jwt from 'jsonwebtoken';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { config } from '../config/index.js';

export const AuthService = {
  async login(userLogon, password, req) {
    const ip = req?.ip || req?.connection?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    const validacion = await UsuariosRepository.validarLogin(userLogon, password);

    if (!validacion || validacion.Success !== 1) {
      const mensaje = validacion?.Mensaje || 'Error de autenticación';
      await AuditRepository.registrarIntento({ userLogon, exitoso: false, ip, userAgent, mensaje });
      throw new Error(mensaje);
    }

    const usuario = await UsuariosRepository.getByLogon(userLogon);
    if (!usuario || !usuario.SwAcceso) {
      await AuditRepository.registrarIntento({ userLogon, exitoso: false, ip, userAgent, mensaje: 'Acceso denegado' });
      throw new Error('Usuario sin acceso habilitado');
    }

    await AuditRepository.registrarIntento({ userLogon, exitoso: true, ip, userAgent, mensaje: 'Login exitoso' });

    const token = jwt.sign(
      { id: usuario.IdUsuario, logon: usuario.User_Logon, nombre: usuario.User_Fullname, rol: usuario.Rol },
      config.jwt.secret,
      { expiresIn: '8h' }
    );

    return {
      token,
      usuario: {
        id: usuario.IdUsuario,
        logon: usuario.User_Logon,
        nombre: usuario.User_Fullname,
        email: usuario.User_Email,
        rol: usuario.Rol,
      },
    };
  },
};
