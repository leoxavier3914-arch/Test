/* ======================================================================
   CONTROLE DE PLACAS – SCRIPT PRINCIPAL
   ====================================================================== */

/* ----------------------------- Bancos locais ----------------------------- */
let bancoCadastros   = JSON.parse(localStorage.getItem("bancoCadastros"))   || [];
let bancoHistorico   = JSON.parse(localStorage.getItem("bancoHistorico"))   || [];
let bancoAutorizados = JSON.parse(localStorage.getItem("bancoAutorizados")) || [];

/* Seleções em listas (UI) */
let cadastroSelecionado   = null;
let autorizadoSelecionado = null;

/* --------------------------- SMTP.js (Email.send) ------------------------ */
const SMTP_SECURE_TOKEN = "2e238640-c22d-48d3-9fd1-bddbed05de92"; // token do smtpjs.com
const SMTP_FROM         = "histplacas@gmail.com";                 // e-mail do token

/* ------------------------- Util: Blob -> Base64 -------------------------- */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/* ------------------- Garantir que a lib DOCX esteja ok ------------------- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Falha ao carregar: " + src));
    document.head.appendChild(s);
  });
}
async function ensureDocx() {
  if (window.docx) return window.docx;
  const cdns = [
    "https://cdn.jsdelivr.net/npm/docx@6.1.5/build/index.js",
    "https://unpkg.com/docx@6.1.5/build/index.js",
  ];
  for (const url of cdns) {
    try {
      await loadScript(url);
      if (window.docx) return window.docx;
    } catch (_) {}
  }
  throw new Error("Biblioteca docx indisponível");
}

/* ---------------------- Geração de DOCX (hoje/ontem) --------------------- */
async function gerarAnexoWordHoje() {
  const { Document, Packer, Paragraph, TextRun } = window.docx;

  const hoje = new Date();
  const dataHoje = formatarData(hoje);
  const filtered = bancoHistorico.filter((i) => i.data === dataHoje);

  let children = [];
  if (filtered.length === 0) {
    children.push(
      new Paragraph({ children: [new TextRun("Nenhum histórico encontrado para hoje.")] })
    );
  } else {
    children = filtered.map((item) =>
      new Paragraph({
        children: [
          new TextRun(
            `🚗 Placa: ${item.placa} | 👤 Nome: ${item.nome} | 🏷 Tipo: ${item.tipo} | ` +
              `🆔 RG/CPF: ${item.rgcpf} | 📍 Status: ${item.status} | ⏰ Entrada: ${item.horarioEntrada || "-"} | ` +
              `⏱ Saída: ${item.horarioSaida || "-"}`
          ),
        ],
      })
    );
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const base64 = await blobToBase64(blob);
  return { name: `historico-${dataHoje}.docx`, data: base64 };
}

async function gerarAnexoWordOntem() {
  const { Document, Packer, Paragraph, TextRun } = await ensureDocx();

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dataOntem = formatarData(d);
  const filtered = bancoHistorico.filter((i) => i.data === dataOntem);

  let children = [];
  if (filtered.length === 0) {
    children.push(
      new Paragraph({ children: [new TextRun("Nenhum histórico encontrado para ontem.")] })
    );
  } else {
    children = filtered.map((item) =>
      new Paragraph({
        children: [
          new TextRun(
            `🚗 Placa: ${item.placa} | 👤 Nome: ${item.nome} | 🏷 Tipo: ${item.tipo} | ` +
              `🆔 RG/CPF: ${item.rgcpf} | 📍 Status: ${item.status} | ⏰ Entrada: ${item.horarioEntrada || "-"} | ` +
              `⏱ Saída: ${item.horarioSaida || "-"}`
          ),
        ],
      })
    );
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const base64 = await blobToBase64(blob);
  return { name: `historico-${dataOntem}.docx`, data: base64 };
}

/* ------------------------- Persistência e telas -------------------------- */
function salvarBanco() {
  localStorage.setItem("bancoCadastros", JSON.stringify(bancoCadastros));
  localStorage.setItem("bancoHistorico", JSON.stringify(bancoHistorico));
  localStorage.setItem("bancoAutorizados", JSON.stringify(bancoAutorizados));
  atualizarCadastros();
  atualizarTabelaAndamento();
  atualizarAutorizados();
}

/* ------------------------ Listagem de Cadastros UI ----------------------- */
function atualizarCadastros() {
  const listaDiv = document.getElementById("listaCadastros");
  if (!listaDiv) return;
  listaDiv.innerHTML = "";
  cadastroSelecionado = null;

  bancoCadastros.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <span><b>${item.placa}</b> - ${item.nome} [${item.tipo}] - RG/CPF: ${item.rgcpf}</span>
      <span class="menuSerra" title="Mais ações">⋮
        <div class="submenu" style="display:none">
          <div onclick="editarCadastro(${index})">Editar</div>
          <div onclick="excluirCadastro(${index})">Excluir</div>
        </div>
      </span>
    `;

    div.onclick = (e) => {
      if (!e.target.classList.contains("menuSerra") && !e.target.closest(".submenu")) {
        selecionarCadastro(index);
      }
    };

    const serrinha = div.querySelector(".menuSerra");
    serrinha.addEventListener("click", (e) => {
      e.stopPropagation();
      const submenu = serrinha.querySelector(".submenu");
      const isVisible = submenu.style.display === "block";
      document.querySelectorAll(".submenu").forEach((s) => (s.style.display = "none"));
      submenu.style.display = isVisible ? "none" : "block";
    });

    listaDiv.appendChild(div);
  });
}
function selecionarCadastro(index) {
  const itens = document.querySelectorAll("#listaCadastros .item");
  const clicado = itens[index];

  if (clicado.classList.contains("selecionado")) {
    clicado.classList.remove("selecionado");
    const submenu = clicado.querySelector(".submenu");
    if (submenu) submenu.style.display = "none";
    cadastroSelecionado = null;
  } else {
    itens.forEach((el, i) => {
      if (i === index) {
        el.classList.add("selecionado");
      } else {
        el.classList.remove("selecionado");
        const submenu = el.querySelector(".submenu");
        if (submenu) submenu.style.display = "none";
      }
    });
    cadastroSelecionado = index;
  }
}

/* ----------------------- Lista de Autorizados (UI) ----------------------- */
function atualizarAutorizados() {
  const listaDiv = document.getElementById("listaAutorizados");
  if (!listaDiv) return;
  listaDiv.innerHTML = "";

  bancoAutorizados.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<b>${item.placa}</b> - ${item.nome} - RG/CPF: ${item.rgcpf}`;
    div.onclick = () => selecionarAutorizado(index);
    listaDiv.appendChild(div);
  });
}
function selecionarAutorizado(index) {
  const itens = document.querySelectorAll("#listaAutorizados .item");
  itens.forEach((el, i) => {
    if (i === index) {
      el.classList.add("selecionado");
      autorizadoSelecionado = index;
    } else {
      el.classList.remove("selecionado");
    }
  });
}

/* ------------------- CRUD de Autorizados (editar/excluir) ---------------- */
function adicionarAutorizado() {
  const nome  = document.getElementById("nomeAutInput").value.trim();
  const placa = (document.getElementById("placaAutInput").value || "").toUpperCase().trim();
  const rgcpf = document.getElementById("rgcpfAutInput").value.trim();

  if (!nome || !placa || !rgcpf) {
    alert("Preencha todos os campos!");
    return;
  }
  bancoAutorizados.push({ nome, placa, rgcpf });
  salvarBanco();

  document.getElementById("nomeAutInput").value = "";
  document.getElementById("placaAutInput").value = "";
  document.getElementById("rgcpfAutInput").value = "";
  alert("Autorizado cadastrado com sucesso!");
}

function iniciarEdicaoAut() {
  if (autorizadoSelecionado === null) {
    alert("Selecione um autorizado para editar!");
    return;
  }
  const item = bancoAutorizados[autorizadoSelecionado];
  mostrarPopup(`
    <h3>Editar Autorizado</h3>
    <input type="text" id="editNome" value="${item.nome}" placeholder="Nome">
    <input type="text" id="editPlaca" value="${item.placa}" placeholder="Placa">
    <input type="text" id="editRgcpf" value="${item.rgcpf}" placeholder="RG/CPF">
    <button class="entrada" onclick="confirmarEdicaoAut(${autorizadoSelecionado})">Confirmar</button>
  `);
}
function confirmarEdicaoAut(index) {
  const nome  = document.getElementById("editNome").value.trim();
  const placa = (document.getElementById("editPlaca").value || "").toUpperCase().trim();
  const rgcpf = document.getElementById("editRgcpf").value.trim();

  if (!nome || !placa || !rgcpf) {
    alert("Preencha todos os campos!");
    return;
  }

  bancoAutorizados[index] = { nome, placa, rgcpf };
  salvarBanco();
  fecharPopup();
  alert("Autorizado editado com sucesso!");

  document.querySelectorAll("#listaAutorizados .item").forEach((el) => el.classList.remove("selecionado"));
  autorizadoSelecionado = null;
}
function iniciarExclusaoAut() {
  if (autorizadoSelecionado === null) {
    alert("Selecione um autorizado para excluir!");
    return;
  }
  const index = autorizadoSelecionado;
  if (confirm(`Deseja realmente excluir ${bancoAutorizados[index].nome}?`)) {
    bancoAutorizados.splice(index, 1);
    autorizadoSelecionado = null;
    salvarBanco();
    alert("Autorizado excluído com sucesso!");
  }
}

/* ----------------------- CRUD de Cadastros (lista) ----------------------- */
function editarCadastro(index) {
  const item = bancoCadastros[index];
  mostrarPopup(`
    <h3>Editar Cadastro</h3>
    <input type="text" id="editNomeCad"  value="${item.nome}"  placeholder="Nome">
    <input type="text" id="editPlacaCad" value="${item.placa}" placeholder="Placa">
    <input type="text" id="editRgcpfCad" value="${item.rgcpf}" placeholder="RG/CPF">
    <select id="editTipoCad">
      <option value="Despacho" ${item.tipo === "Despacho" ? "selected" : ""}>Despacho</option>
      <option value="Retiro"   ${item.tipo === "Retiro"   ? "selected" : ""}>Retiro</option>
    </select>
    <button class="entrada" onclick="confirmarEdicaoCad(${index})">Confirmar</button>
  `);
}
function confirmarEdicaoCad(index) {
  const nome  = document.getElementById("editNomeCad").value.trim();
  const placa = (document.getElementById("editPlacaCad").value || "").toUpperCase().trim();
  const rgcpf = document.getElementById("editRgcpfCad").value.trim();
  const tipo  = document.getElementById("editTipoCad").value;

  if (!nome || !placa || !rgcpf || !tipo) {
    alert("Preencha todos os campos!");
    return;
  }
  bancoCadastros[index] = { nome, placa, rgcpf, tipo };
  salvarBanco();
  fecharPopup();
  cadastroSelecionado = null;
}
function excluirCadastro(index) {
  if (confirm(`Deseja realmente excluir ${bancoCadastros[index].nome}?`)) {
    bancoCadastros.splice(index, 1);
    salvarBanco();
    cadastroSelecionado = null;
  }
}

/* -------------------------- Datas e conversões --------------------------- */
function formatarData(d) {
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
}
function converterDataInput(input) {
  const p = input.split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/* --------------------------- Histórico (tela) ---------------------------- */
function filtrarHistorico() {
  const input = document.getElementById("dataFiltro").value;
  const dataFiltro = input ? converterDataInput(input) : formatarData(new Date());
  const listaDiv = document.getElementById("listaHistorico");
  if (!listaDiv) return;

  listaDiv.innerHTML = "";
  bancoHistorico
    .filter((i) => i.data === dataFiltro)
    .forEach((item) => {
      let cor =
        item.status === "Em andamento"
          ? "red"
          : item.status === "Finalizado"
          ? "green"
          : "black";
      listaDiv.innerHTML += `
        <div class="item">
          <b>${item.placa}</b> - ${item.nome} [${item.tipo}] - RG/CPF: ${item.rgcpf}
          <br>Data: ${item.data}
          <br>Status: <span style="color:${cor}">${item.status}</span>
          <br>Entrada: <span class="horaEntrada">${item.horarioEntrada || "-"}</span>
          | Saída: <span class="horaSaida">${item.horarioSaida || "-"}</span>
        </div>`;
    });
}

/* ------------------------------- CSV/PDF -------------------------------- */
function exportarCSV() {
  const dataFiltro = document.getElementById("dataFiltro").value;
  const dataTexto = dataFiltro ? converterDataInput(dataFiltro) : formatarData(new Date());
  const filtered = bancoHistorico.filter((i) => i.data === dataTexto);
  if (filtered.length === 0) {
    alert("Nenhum dado para exportar.");
    return;
  }

  let csv = "Placa,Nome,Tipo,RG/CPF,Data,Status,Entrada,Saída\n";
  filtered.forEach((item) => {
    csv += `${item.placa},${item.nome},${item.tipo},${item.rgcpf},${item.data},${item.status},${item.horarioEntrada || "-"},${item.horarioSaida || "-"}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `historico-${dataTexto}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  alert("Exportado com sucesso!");
}

function exportarPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Biblioteca jsPDF não encontrada na página.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const tabela = document.getElementById("listaHistorico");
  if (!tabela || tabela.innerHTML.trim() === "") {
    alert("Não há dados para exportar!");
    return;
  }

  doc.setFontSize(14);
  doc.text("Histórico de Placas", 105, 15, null, null, "center");

  let y = 20;
  const rows = tabela.querySelectorAll(".item");
  rows.forEach((row) => {
    doc.setFontSize(12);
    doc.text(row.innerText.split("\n").join(" | "), 10, y);
    y += 8;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  const dataHoje = new Date().toISOString().split("T")[0];
  doc.save(`historico-${dataHoje}.pdf`);
}

/* --------- Andamento (tabela de “em andamento” + botão de saída) -------- */
function atualizarTabelaAndamento() {
  const tbody = document.getElementById("tabelaAndamento");
  if (!tbody) return;
  tbody.innerHTML = "";
  bancoHistorico
    .filter((h) => h.status === "Em andamento")
    .forEach((h) => {
      tbody.innerHTML += `
        <tr>
          <td>${h.placa}</td>
          <td>${h.nome}</td>
          <td class="horaEntrada">${h.horarioEntrada}</td>
          <td><button class="saida" onclick="marcarSaida('${h.placa}')">Saída</button></td>
        </tr>`;
    });
}

/* ----------------------- Entrada/Saída (verificação) --------------------- */
function verificarPlaca() {
  const placaInput = document.getElementById("placaInput");
  const placa = (placaInput.value || "").toUpperCase().trim();
  placaInput.value = placa;

  if (placa.length !== 7) {
    alert("A placa deve ter exatamente 7 caracteres!");
    placaInput.value = "";
    placaInput.focus();
    return;
  }

  const autorizado = bancoAutorizados.find((i) => i.placa === placa);
  if (autorizado) {
    mostrarPopup(`
      <h3>AUTORIZADO ✅</h3>
      <p><b>Nome:</b> ${autorizado.nome}</p>
      <p><b>Placa:</b> ${autorizado.placa}</p>
      <p><b>Modelo:</b> ${autorizado.modelo || "-"}</p>
      <p><b>Cor:</b> ${autorizado.cor || "-"}</p>
      <button class="entrada" onclick="fecharPopup()">OK</button>
    `);
  } else {
    const registro = bancoCadastros.find((i) => i.placa === placa);
    const ultimoHistorico = [...bancoHistorico].reverse().find((h) => h.placa === placa);
    const statusAtual = ultimoHistorico ? ultimoHistorico.status : "-";
    const cor =
      statusAtual === "Em andamento" ? "red" : statusAtual === "Finalizado" ? "green" : "black";

    if (registro) {
      mostrarPopup(`
        <h3>Placa encontrada ✅</h3>
        <p><b>Placa:</b> ${placa}</p>
        <p><b>Nome:</b> ${registro.nome}</p>
        <p><b>RG/CPF:</b> ${registro.rgcpf}</p>
        <p><b>Status:</b> <span style="color:${cor}">${statusAtual}</span></p>
        <label>Tipo:</label>
        <select id="tipoEntrada">
          <option value="Despacho" ${registro.tipo === "Despacho" ? "selected" : ""}>Despacho</option>
          <option value="Retiro"   ${registro.tipo === "Retiro"   ? "selected" : ""}>Retiro</option>
        </select>
        <br><br>
        <button class="entrada" onclick="marcarEntradaComTipo('${placa}')">Entrada</button>
        <button class="saida"   onclick="marcarSaida('${placa}')">Saída</button>
      `);
    } else {
      mostrarPopup(`
        <h3>Placa não registrada ⚠️</h3>
        <input type="text" id="nomeInput"  placeholder="Nome">
        <input type="text" id="rgcpfInput" placeholder="RG/CPF">
        <select id="tipoInput">
          <option value="" disabled selected>Tipo:</option>
          <option value="Despacho">Despacho</option>
          <option value="Retiro">Retiro</option>
        </select>
        <button class="entrada" onclick="entradaNovaPlaca('${placa}')">Entrada</button>
      `);
    }
  }

  placaInput.value = "";
  placaInput.focus();
}

function marcarEntradaComTipo(placa) {
  const tipoSelecionado = document.getElementById("tipoEntrada").value;
  const existe = [...bancoHistorico]
    .reverse()
    .find((h) => h.placa === placa && h.status === "Em andamento");
  if (existe) {
    alert("Essa placa já está em andamento!");
    return;
  }

  const cadastro =
    bancoCadastros.find((i) => i.placa === placa) ||
    bancoAutorizados.find((i) => i.placa === placa);
  if (!cadastro) return;

  const hoje = formatarData(new Date());
  bancoHistorico.push({
    nome: cadastro.nome,
    placa: cadastro.placa,
    rgcpf: cadastro.rgcpf,
    tipo: tipoSelecionado,
    status: "Em andamento",
    data: hoje,
    horarioEntrada: new Date().toLocaleTimeString(),
    horarioSaida: "",
  });

  salvarBanco();
  fecharPopup();
  alert("Entrada registrada com sucesso! ✅");
}

function entradaNovaPlaca(placa) {
  const nome = document.getElementById("nomeInput").value.trim();
  const rgcpf = document.getElementById("rgcpfInput").value.trim();
  const tipo = document.getElementById("tipoInput").value;

  if (!nome || !rgcpf || !tipo || !placa) {
    alert("Preencha todos os campos!");
    return;
  }
  const hoje = formatarData(new Date());

  bancoCadastros.push({ nome, placa, rgcpf, tipo });
  bancoHistorico.push({
    nome,
    placa,
    rgcpf,
    tipo,
    status: "Em andamento",
    data: hoje,
    horarioEntrada: new Date().toLocaleTimeString(),
    horarioSaida: "",
  });

  salvarBanco();
  fecharPopup();
  alert("Entrada registrada com sucesso! ✅");
}

function marcarEntrada(placa) {
  const existe = [...bancoHistorico]
    .reverse()
    .find((h) => h.placa === placa && h.status === "Em andamento");
  if (existe) {
    alert("Essa placa já está em andamento!");
    return;
  }
  const cadastro =
    bancoCadastros.find((i) => i.placa === placa) ||
    bancoAutorizados.find((i) => i.placa === placa);
  if (!cadastro) return;

  const hoje = formatarData(new Date());
  bancoHistorico.push({
    nome: cadastro.nome,
    placa: cadastro.placa,
    rgcpf: cadastro.rgcpf,
    tipo: cadastro.tipo || "Autorizado",
    status: "Em andamento",
    data: hoje,
    horarioEntrada: new Date().toLocaleTimeString(),
    horarioSaida: "",
  });
  salvarBanco();
  fecharPopup();
}

function marcarSaida(placa) {
  const ultimo = [...bancoHistorico]
    .reverse()
    .find((h) => h.placa === placa && h.status === "Em andamento");
  if (!ultimo) return;

  ultimo.status = "Finalizado";
  ultimo.horarioSaida = new Date().toLocaleTimeString();
  salvarBanco();

  const msg = document.getElementById("mensagem");
  if (msg) {
    msg.innerHTML = "Saída registrada com sucesso! ✅";
    setTimeout(() => (msg.innerHTML = ""), 5000);
  }
  fecharPopup();
}

/* --------------------------- Popup e navegação --------------------------- */
function mostrarPopup(html) {
  const conteudo = document.getElementById("popupConteudo");
  const overlay  = document.getElementById("overlay");
  const card     = document.getElementById("popupCard");
  if (!conteudo || !overlay || !card) return;

  conteudo.innerHTML = html;
  overlay.style.display = "block";
  card.style.display = "block";
}
function fecharPopup() {
  const overlay = document.getElementById("overlay");
  const card    = document.getElementById("popupCard");
  if (!overlay || !card) return;
  overlay.style.display = "none";
  card.style.display = "none";
}
function toggleMenu() {
  const menu = document.getElementById("menu");
  if (menu) menu.classList.toggle("menu-open");
}
function mostrarPagina(id) {
  ["inicioContainer", "cadastroContainer", "autorizadosContainer", "historicoContainer"].forEach(
    (el) => {
      const node = document.getElementById(el);
      if (node) node.style.display = "none";
    }
  );
  const alvo = document.getElementById(id);
  if (alvo) alvo.style.display = "block";

  if (id === "historicoContainer" && !document.getElementById("dataFiltro").value) {
    const hoje = new Date();
    document.getElementById("dataFiltro").value = `${hoje.getFullYear()}-${String(
      hoje.getMonth() + 1
    ).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    filtrarHistorico();
  }
}

/* --------------------- Limpar histórico (com senha) ---------------------- */
function limparTudo() {
  let senha = prompt("Digite a senha para limpar os dados:");
  if (senha === "1234") {
    if (confirm("Deseja realmente limpar o histórico e mensagens?")) {
      bancoHistorico = [];
      localStorage.setItem("bancoHistorico", JSON.stringify(bancoHistorico));
      const msg = document.getElementById("mensagem");
      if (msg) msg.innerHTML = "";
      atualizarTabelaAndamento();
      filtrarHistorico();
      alert("Histórico e mensagens foram limpos!");
    }
  } else if (senha !== null) {
    alert("Senha incorreta ❌");
  }
}

/* ------------------- Envio por e-mail (manual/automático) ---------------- */
async function enviarEmailOntem() {
  // nome mantido, mas envia HOJE
  const hoje = new Date();
  const dataHoje = formatarData(hoje);
  const filtered = bancoHistorico.filter((i) => i.data === dataHoje);
  if (filtered.length === 0) {
    alert("Nenhum histórico encontrado para hoje!");
    return;
  }

  let mensagem = "📌 Histórico de Placas - " + dataHoje + "\n\n";
  filtered.forEach((item) => {
    mensagem += `🚗 Placa: ${item.placa} | 👤 Nome: ${item.nome} | 🏷 Tipo: ${item.tipo} | 🆔 RG/CPF: ${item.rgcpf} | 📍 Status: ${item.status} | ⏰ Entrada: ${item.horarioEntrada || "-"} | ⏱ Saída: ${item.horarioSaida || "-"}\n`;
  });

  try {
    const anexo = await gerarAnexoWordHoje();
    await Email.send({
      SecureToken: SMTP_SECURE_TOKEN,
      To: "leomatos3914@gmail.com",
      From: SMTP_FROM,
      Subject: "Histórico Diário (Envio Manual de Hoje)",
      Body: mensagem.replace(/\n/g, "<br>"),
      Attachments: [anexo],
    });
    alert("📧 Histórico de hoje enviado manualmente com sucesso!");
  } catch (err) {
    alert("❌ Erro ao enviar: " + (err && err.message ? err.message : err));
  }
}

async function enviarHistoricoDiaAnterior() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dataOntem = formatarData(d);

  const filtered = bancoHistorico.filter((i) => i.data === dataOntem);
  if (filtered.length === 0) return;

  let mensagem = "📌 Histórico de Placas - " + dataOntem + "\n\n";
  filtered.forEach((item) => {
    mensagem += `🚗 Placa: ${item.placa} | 👤 Nome: ${item.nome} | 🏷 Tipo: ${item.tipo} | 🆔 RG/CPF: ${item.rgcpf} | 📍 Status: ${item.status} | ⏰ Entrada: ${item.horarioEntrada || "-"} | ⏱ Saída: ${item.horarioSaida || "-"}\n`;
  });

  try {
    const anexo = await gerarAnexoWordOntem();
    await Email.send({
      SecureToken: SMTP_SECURE_TOKEN,
      To: "leomatos3914@gmail.com",
      From: SMTP_FROM,
      Subject: "Histórico Diário - " + dataOntem,
      Body: mensagem.replace(/\n/g, "<br>"),
      Attachments: [anexo],
    });

    console.log("✅ Histórico de " + dataOntem + " enviado por e-mail.");
    localStorage.setItem("ultimoDiaEnviado", dataOntem);
  } catch (err) {
    console.error("❌ Erro no envio automático:", err);
  }
}

/* -------------------------- Agendamento diário --------------------------- */
function verificarEnvioDiario() {
  const agora = new Date();
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const dataOntem = formatarData(d);

  const ultimoDiaEnviado = localStorage.getItem("ultimoDiaEnviado");
  if (ultimoDiaEnviado === dataOntem) return;

  if (agora.getHours() >= 0) {
    enviarHistoricoDiaAnterior();
  }
}
setInterval(verificarEnvioDiario, 60 * 1000);

/* --------------------- Exportação automática em PDF ---------------------- */
function checarExportacaoAutomaticaPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) return; // só se a lib existir
  const { jsPDF } = window.jspdf;

  const agora = new Date();
  const ultimaExportacao = localStorage.getItem("ultimaExportacao");
  let dataInicio;

  if (ultimaExportacao) {
    const ultima = new Date(ultimaExportacao);
    const diff = agora - ultima;
    const horas24 = 24 * 60 * 60 * 1000;
    if (diff >= horas24) {
      dataInicio = ultima;
    } else {
      return;
    }
  } else {
    dataInicio = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
  }

  const historicoFiltrado = bancoHistorico.filter((item) => {
    const [dia, mes, ano] = item.data.split("/").map(Number);
    const dataItem = new Date(ano, mes - 1, dia);
    return dataItem > dataInicio;
  });

  if (historicoFiltrado.length === 0) return;

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Histórico de Placas", 105, 15, null, null, "center");

  let y = 25;
  doc.setFontSize(12);
  historicoFiltrado.forEach((item) => {
    doc.text(
      `Placa: ${item.placa} | Nome: ${item.nome} | Tipo: ${item.tipo} | RG/CPF: ${item.rgcpf} | Data: ${item.data} | Status: ${item.status}`,
      10,
      y
    );
    y += 8;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  const dataHoje = new Date().toISOString().split("T")[0];
  doc.save(`historico-${dataHoje}.pdf`);
  localStorage.setItem("ultimaExportacao", agora.toISOString());
  console.log("Exportação automática em PDF realizada!");
}

/* --------------------- Backup/Restore do localStorage -------------------- */
function exportLocalStorage() {
  return JSON.stringify({
    bancoCadastros,
    bancoHistorico,
    bancoAutorizados,
  });
}
function downloadLS(filename = "backup_localstorage.json") {
  const blob = new Blob([exportLocalStorage()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* Botão “Exportar LS” */
function criarBotaoExportLS() {
  const area = document.getElementById("historicoContainer");
  if (!area) return;

  const btn = document.createElement("button");
  btn.textContent = "Exportar LS";
  btn.style =
    "padding:5px 10px; margin:5px; cursor:pointer; background:#2196F3; color:white; border:none; border-radius:5px;";
  btn.addEventListener("click", () => {
    downloadLS();
    localStorage.setItem("lastLSBackup", Date.now().toString());
    alert("Backup exportado!");
  });
  area.insertBefore(btn, null);
}
criarBotaoExportLS();

/* Botão + Input “Importar LS” */
const importInput = document.createElement("input");
importInput.type = "file";
importInput.accept = ".json";
importInput.style.display = "none";
document.body.appendChild(importInput);

const importBtn = document.createElement("button");
importBtn.textContent = "Importar LS";
importBtn.style = "padding:5px 10px; margin:5px; cursor:pointer;";
const histCont = document.getElementById("historicoContainer");
if (histCont) histCont.appendChild(importBtn);

importBtn.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      const chaves = ["bancoCadastros", "bancoHistorico", "bancoAutorizados"];
      if (!chaves.every((k) => Object.prototype.hasOwnProperty.call(dados, k))) {
        alert("Arquivo inválido!");
        return;
      }

      chaves.forEach((k) => localStorage.setItem(k, JSON.stringify(dados[k])));
      bancoCadastros = dados.bancoCadastros;
      bancoHistorico = dados.bancoHistorico;
      bancoAutorizados = dados.bancoAutorizados;

      salvarBanco();
      alert("Backup importado com sucesso!");
      importInput.value = "";
    } catch (err) {
      console.error(err);
      alert("Erro ao importar arquivo!");
    }
  };
  reader.readAsText(file);
});

/* ------------------------------- Inicialização --------------------------- */
mostrarPagina("inicioContainer");
salvarBanco();
window.addEventListener("load", checarExportacaoAutomaticaPDF);
