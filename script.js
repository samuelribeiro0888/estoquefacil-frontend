const API_URL = "https://estoquefacil-backend.vercel.app";

const form = document.getElementById("form");
const campos = {
  id: document.getElementById("id"),
  nome: document.getElementById("nome"),
  categoria: document.getElementById("categoria"),
  preco: document.getElementById("preco"),
  quantidade: document.getElementById("quantidade"),
};
const lista = document.getElementById("lista");
const resumo = document.getElementById("resumo");
const msg = document.getElementById("msg");
const tituloForm = document.getElementById("titulo-form");
const btnSalvar = document.getElementById("btn-salvar");
const btnCancelar = document.getElementById("btn-cancelar");

const LIMITE_BAIXO = 10; // abaixo disso o produto fica destacado
let produtos = [];

const moeda = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function mostrarMsg(texto, tipo) {
  msg.textContent = texto;
  msg.className = tipo || "";
}

// Faz a requisição e trata erros da API
async function chamar(caminho, opcoes) {
  const resp = await fetch(API_URL + caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(corpo.erro || "Erro ao falar com o servidor.");
  return corpo;
}

// READ
async function carregar() {
  try {
    produtos = await chamar("/produtos");
    desenhar();
  } catch (e) {
    resumo.textContent = "Não foi possível carregar os produtos.";
    mostrarMsg(e.message, "erro");
  }
}

function celula(texto, classe) {
  const td = document.createElement("td");
  td.textContent = texto;
  if (classe) td.className = classe;
  return td;
}

function desenhar() {
  lista.innerHTML = "";
  const baixos = produtos.filter((p) => p.quantidade < LIMITE_BAIXO).length;
  resumo.textContent = produtos.length
    ? `${produtos.length} produtos cadastrados, ${baixos} com estoque baixo`
    : "Nenhum produto cadastrado ainda";

  if (!produtos.length) {
    const tr = document.createElement("tr");
    const td = celula("Cadastre o primeiro produto no formulário acima.", "vazio");
    td.colSpan = 5;
    tr.appendChild(td);
    lista.appendChild(tr);
    return;
  }

  produtos.forEach((p) => {
    const tr = document.createElement("tr");
    if (p.quantidade < LIMITE_BAIXO) tr.className = "baixo";

    tr.appendChild(celula(p.nome));
    tr.appendChild(celula(p.categoria || "-"));
    tr.appendChild(celula(moeda(p.preco)));
    tr.appendChild(celula(p.quantidade, "qtd"));

    const acoes = document.createElement("td");
    acoes.className = "botoes";

    const editar = document.createElement("button");
    editar.textContent = "Editar";
    editar.className = "pequeno secundario";
    editar.onclick = () => iniciarEdicao(p);

    const excluir = document.createElement("button");
    excluir.textContent = "Excluir";
    excluir.className = "pequeno perigo";
    excluir.onclick = () => excluirProduto(p);

    acoes.append(editar, excluir);
    tr.appendChild(acoes);
    lista.appendChild(tr);
  });
}

function limparForm() {
  form.reset();
  campos.id.value = "";
  tituloForm.textContent = "Novo produto";
  btnSalvar.textContent = "Adicionar produto";
  btnCancelar.hidden = true;
}

function iniciarEdicao(p) {
  campos.id.value = p.id;
  campos.nome.value = p.nome;
  campos.categoria.value = p.categoria || "";
  campos.preco.value = p.preco;
  campos.quantidade.value = p.quantidade;
  tituloForm.textContent = `Editando: ${p.nome}`;
  btnSalvar.textContent = "Salvar alterações";
  btnCancelar.hidden = false;
  mostrarMsg("");
  campos.nome.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// CREATE e UPDATE
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const editando = campos.id.value !== "";
  const corpo = {
    nome: campos.nome.value,
    categoria: campos.categoria.value,
    preco: campos.preco.value,
    quantidade: campos.quantidade.value,
  };

  try {
    await chamar(editando ? `/produtos/${campos.id.value}` : "/produtos", {
      method: editando ? "PUT" : "POST",
      body: JSON.stringify(corpo),
    });
    mostrarMsg(editando ? "Alterações salvas." : "Produto adicionado.", "ok");
    limparForm();
    carregar();
  } catch (e) {
    mostrarMsg(e.message, "erro");
  }
});

btnCancelar.addEventListener("click", () => {
  limparForm();
  mostrarMsg("");
});

// DELETE
async function excluirProduto(p) {
  if (!confirm(`Excluir "${p.nome}"? Essa ação não pode ser desfeita.`)) return;
  try {
    await chamar(`/produtos/${p.id}`, { method: "DELETE" });
    mostrarMsg("Produto excluído.", "ok");
    if (campos.id.value === String(p.id)) limparForm();
    carregar();
  } catch (e) {
    mostrarMsg(e.message, "erro");
  }
}

carregar();
