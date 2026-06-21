import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';
import { config } from '../config/index.js';

export const AuthService = {
  async login(nombreUsuario, password) {
    const usuario = await UsuariosRepository.getByNombreUsuario(nombreUsuario);
    if (!usuario) throw new Error('Usuario o contraseña incorrectos');
    if (usuario.Estado !== 'ACTIVO') throw new Error('Usuario inactivo');

    const valido = await bcrypt.compare(password, usuario.PasswordHash);
    if (!valido) throw new Error('Usuario o contraseña incorrectos');

    await UsuariosRepository.updateUltimoAcceso(usuario.IdUsuario);

    const token = jwt.sign(
      { id: usuario.IdUsuario, nombre: usuario.NombreUsuario, rol: usuario.Rol },
      config.jwt.secret,
      { expiresIn: '8h' }
    );

    return {
      token,
      usuario: {
        id: usuario.IdUsuario,
        nombre: usuario.NombreUsuario,
        correo: usuario.Correo,
        rol: usuario.Rol,
      },
    };
  },

  async crearUsuario(data) {
    const existente = await UsuariosRepository.getByNombreUsuario(data.NombreUsuario);
    if (existente) throw new Error('El nombre de usuario ya existe');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.Password, salt);

    return UsuariosRepository.create({
      ...data,
      PasswordHash: hash,
    });
  },

  async verificarToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch {
      return null;
    }
  },
};
