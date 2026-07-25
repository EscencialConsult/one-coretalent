export function combinarPerfilConCv(perfilEnEdicion, perfilActualizado) {
  return {
    ...perfilEnEdicion,
    cv_nombre: perfilActualizado.cv_nombre,
    cv_url: perfilActualizado.cv_url,
  };
}
