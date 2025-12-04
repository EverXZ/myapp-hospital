export async function getUsuarios() {
  const res = await fetch("http://localhost:3000/api/usuarios");
  return await res.json();
}


