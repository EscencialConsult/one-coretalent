export function temaEmpresa(empresa) {
  if (!empresa) return undefined;
  const secundario = empresa.color_secundario || "#4FADD1";
  return {
    "--violeta": empresa.color_acento,
    "--grad": empresa.color_acento,
    "--acento2": secundario,
    "--rosa": secundario,
  };
}
