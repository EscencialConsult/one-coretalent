export function temaEmpresa(empresa) {
  if (!empresa) return undefined;
  const secundario = empresa.color_secundario || "#6be1e3";
  return {
    "--violeta": empresa.color_acento,
    "--grad": empresa.color_acento,
    "--acento2": secundario,
    "--rosa": secundario,
  };
}
