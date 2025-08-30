// ===== Banco de dados local =====
let bancoCadastros = JSON.parse(localStorage.getItem("bancoCadastros")) || [];
let bancoHistorico = JSON.parse(localStorage.getItem("bancoHistorico")) || [];
let bancoAutorizados = JSON.parse(localStorage.getItem("bancoAutorizados")) || [];

// ===== Configuração SMTP.js =====
const SMTP_SECURE_TOKEN = "2e238640-c22d-48d3-9fd1-bddbed05de92"; // gerado no smtpjs.com
const SMTP_FROM = "histplacas@gmail.com";  // email usado no token

// Converte Blob -> Base64 (para anexar no e-mail)
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Gera DOCX de HOJE
async function gerarAnexoWordHoje() {
  const { Document, Packer, Paragraph, TextRun } = await ensureDocx();

  const hoje = new Date();
  const dataHoje = formatarData(hoje);
  const filtered = bancoHistorico.filter(item => item.data === dataHoje);

  let children = [];
  if (filtered.length === 0) {
    children.push(new Paragraph({ children: [ new TextRun("Nenhum histórico encontrado para hoje.") ] }));
  } else {
    children = filtered.map(item =>
      new Paragraph({
        children: [ new TextRun(
          `🚗 Placa: ${item.placa} | 👤 Nome: ${item.nome} | 🏷 Tipo: ${item.tipo} | ` +
          `🆔 RG/CPF: ${item.rgcpf} | 📍 Status: ${item.status} | ⏰ Entrada: ${item.horarioEntrada || "-"} | ` +
          `⏱ Saída: ${item.horarioSaida || "-"}`
        ) ]
      })
    );
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const base64 = await blobToBase64(blob);
  return { name: `historico-${dataHoje}.docx`, data: base64 };
}

// Gera DOCX de ONTEM
async function gerarAnexoWordOntem() {
  const { Document, Packer, Paragraph, TextRun } = await ensureDocx();

  const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
  const dataOntem = formatarData(ontem);
  const filtered = bancoHistorico.filter(item => item.data === dataOntem);

  let children = [];
  if (filtered.length === 0) {
    children.push(new Paragraph({ children: [ new TextRun("Nenhum histórico encontrado para ontem.") ] }));
  } else {
    children = filtered.map(item =>
      new Paragraph({
        children: [ new TextRun(
          `🚗 Placa: ${item.placa} | 👤 Nome: ${item.nome} | 🏷 Tipo: ${item.tipo} | ` +
          `🆔 RG/CPF: ${item.rgcpf} | 📍 Status: ${item.status} | ⏰ Entrada: ${item.horarioEntrada || "-"} | ` +
          `⏱ Saída: ${item.horarioSaida || "-"}`
        ) ]
      })
    );
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const base64 = await blobToBase64(blob);
  return { name: `historico-${dataOntem}.docx`, data: base64 };
}


function salvarBanco() {
  localStorage.setItem("bancoCadastros", JSON.stringify(bancoCadastros));
  localStorage.setItem("bancoHistorico", JSON.stringify(bancoHistorico));
  localStorage.setItem("bancoAutorizados", JSON.stringify(bancoAutorizados));
  atualizarCadastros();
  atualizarTabelaAndamento();
  atualizarAutorizados();
}

// ===== AtualizaÃ§Ã£o de listas =====
function atualizarCadastros() {
  const listaDiv = document.getElementById("listaCadastros");
  listaDiv.innerHTML = "";
  cadastroSelecionado = null; // limpa seleÃ§Ã£o ao atualizar

  bancoCadastros.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <span><b>${item.placa}</b> - ${item.nome} [${item.tipo}] - RG/CPF: ${item.rgcpf}</span>
      <span class="menuSerra">â‹®
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
  e.stopPropagation(); // nÃ£o ativa seleÃ§Ã£o do item

  const submenu = serrinha.querySelector(".submenu");
  const isVisible = submenu.style.display === "block"; // verifica antes de fechar outros

  // Fecha todos os submenus
  document.querySelectorAll(".submenu").forEach(s => s.style.display = "none");

  // Se estava aberto, fecha; se estava fechado, abre
  submenu.style.display = isVisible ? "none" : "block";
});

    listaDiv.appendChild(div);
  });
}

function selecionarCadastro(index) {
  const itens = document.querySelectorAll("#listaCadastros .item");
  const clicado = itens[index];

  if (clicado.classList.contains("selecionado")) {
    // Se ja  estava selecionado, desmarcar e esconder serrinha/submenu
    clicado.classList.remove("selecionado");
    const submenu = clicado.querySelector(".submenu");
    if (submenu) submenu.style.display = "none";
    cadastroSelecionado = null;
  } else {
    // Marca o item clicado e desmarca os outros
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




function atualizarAutorizados() {
  const listaDiv = document.getElementById("listaAutorizados");
  listaDiv.innerHTML = "";

  bancoAutorizados.forEach((item, index) => {
    listaDiv.innerHTML += `
      <div class="item">
        <input type="radio" name="selecionadoAut" value="${index}" id="aut${index}">
        <label for="aut${index}"><b>${item.placa}</b> - ${item.nome} - RG/CPF: ${item.rgcpf}</label>
      </div>
    `;
  });
}

function atualizarTabelaAndamento() {
  const tbody = document.getElementById("tabelaAndamento");
  tbody.innerHTML = "";
  bancoHistorico.filter(h => h.status === "Em andamento").forEach(h => {
    tbody.innerHTML += `<tr><td>${h.placa}</td><td>${h.nome}</td><td class="horaEntrada">${h.horarioEntrada}</td><td><button class="saida" onclick="marcarSaida('${h.placa}')">SaÃ­da</button></td></tr>`;
  });
}

// ===== Adicionar autorizado =====
function adicionarAutorizado() {
  const nome = document.getElementById("nomeAutInput").value;
  const placa = document.getElementById("placaAutInput").value;
  const rgcpf = document.getElementById("rgcpfAutInput").value;
  if (!nome || !placa || !rgcpf) { alert("Preencha todos os campos!"); return; }
  bancoAutorizados.push({ nome, placa, rgcpf });
  salvarBanco();
  document.getElementById("nomeAutInput").value = "";
  document.getElementById("placaAutInput").value = "";
  document.getElementById("rgcpfAutInput").value = "";
  alert("Autorizado cadastrado com sucesso!");
}

function atualizarAutorizados() {
  const listaDiv = document.getElementById("listaAutorizados");
  listaDiv.innerHTML = "";

  bancoAutorizados.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<b>${item.placa}</b> - ${item.nome} - RG/CPF: ${item.rgcpf}`;
    div.onclick = () => selecionarAutorizado(index);
    listaDiv.appendChild(div);
  });
}

let autorizadoSelecionado = null;

function atualizarAutorizados() {
  const listaDiv = document.getElementById("listaAutorizados");
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

// ===== Editar autorizado =====
function iniciarEdicaoAut() {
  if (autorizadoSelecionado === null) {
    alert("Selecione um autorizado para editar!");
    return;
  }
  const index = autorizadoSelecionado;
  const item = bancoAutorizados[index];

  mostrarPopup(`
    <h3>Editar Autorizado</h3>
    <input type="text" id="editNome" value="${item.nome}" placeholder="Nome">
    <input type="text" id="editPlaca" value="${item.placa}" placeholder="Placa">
    <input type="text" id="editRgcpf" value="${item.rgcpf}" placeholder="RG/CPF">
    <button class="entrada" onclick="confirmarEdicaoAut(${index})">Confirmar</button>
  `);
}

function confirmarEdicaoAut(index) {
  const nome = document.getElementById("editNome").value;
  const placa = document.getElementById("editPlaca").value;
  const rgcpf = document.getElementById("editRgcpf").value;

  if (!nome || !placa || !rgcpf) { alert("Preencha todos os campos!"); return; }

  bancoAutorizados[index] = { nome, placa, rgcpf };
  salvarBanco();
  fecharPopup();
  alert("Autorizado editado com sucesso!");

  // Deseleciona o autorizado editado
  const itens = document.querySelectorAll("#listaAutorizados .item");
  itens.forEach(el => el.classList.remove("selecionado"));
  autorizadoSelecionado = null;
}

// ===== Excluir autorizado =====
function iniciarExclusaoAut() {
  if (autorizadoSelecionado === null) {
    alert("Selecione um autorizado para excluir!");
    return;
  }
  const index = autorizadoSelecionado;

  if (confirm(`Deseja realmente excluir ${bancoAutorizados[index].nome}?`)) {
    bancoAutorizados.splice(index, 1);
    autorizadoSelecionado = null; // limpa seleÃ§Ã£o
    salvarBanco();
    alert("Autorizado excluÃ­do com sucesso!");
  }
}

function editarCadastro(index) {
  const item = bancoCadastros[index];
  mostrarPopup(`
    <h3>Editar Cadastro</h3>
    <input type="text" id="editNomeCad" value="${item.nome}" placeholder="Nome">
    <input type="text" id="editPlacaCad" value="${item.placa}" placeholder="Placa">
    <input type="text" id="editRgcpfCad" value="${item.rgcpf}" placeholder="RG/CPF">
    <select id="editTipoCad">
      <option value="Despacho" ${item.tipo === "Despacho" ? "selected" : ""}>Despacho</option>
      <option value="Retiro" ${item.tipo === "Retiro" ? "selected" : ""}>Retiro</option>
    </select>
    <button class="entrada" onclick="confirmarEdicaoCad(${index})">Confirmar</button>
  `);
}

function confirmarEdicaoCad(index) {
  const nome = document.getElementById("editNomeCad").value;
  const placa = document.getElementById("editPlacaCad").value;
  const rgcpf = document.getElementById("editRgcpfCad").value;
  const tipo = document.getElementById("editTipoCad").value;

  if (!nome || !placa || !rgcpf || !tipo) { alert("Preencha todos os campos!"); return; }

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

// ===== Função de data =====
function formatarData(d) { const dia = String(d.getDate()).padStart(2, '0'); const mes = String(d.getMonth() + 1).padStart(2, '0'); return `${dia}/${mes}/${d.getFullYear()}`; }
function converterDataInput(input) { const p = input.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }

// ===== Historico =====
function filtrarHistorico() {
  const input = document.getElementById("dataFiltro").value;
  const dataFiltro = input ? converterDataInput(input) : formatarData(new Date());
  const listaDiv = document.getElementById("listaHistorico");
  listaDiv.innerHTML = "";
  bancoHistorico.filter(i => i.data === dataFiltro).forEach(item => {
    let cor = item.status === "Em andamento" ? "red" : item.status === "Finalizado" ? "green" : "black";
    listaDiv.innerHTML += `<div class="item"><b>${item.placa}</b> - ${item.nome} [${item.tipo}] - RG/CPF: ${item.rgcpf}<br>Data:${item.data}<br>Status:<span style="color:${cor}">${item.status}</span><br>Entrada:<span class="horaEntrada">${item.horarioEntrada || "-"}</span>|SaÃ­da:<span class="horaSaida">${item.horarioSaida || "-"}</span></div>`;
  });
}

// ===== Exportaçao CSV =====
function exportarCSV() {
  const dataFiltro = document.getElementById("dataFiltro").value;
  const dataTexto = dataFiltro ? converterDataInput(dataFiltro) : formatarData(new Date());
  const filtered = bancoHistorico.filter(item => item.data === dataTexto);
  if (filtered.length === 0) { alert("Nenhum dado para exportar."); return; }

  let csv = "Placa,Nome,Tipo,RG/CPF,Data,Status,Entrada,SaÃ­da\n";
  filtered.forEach(item => {
    csv += `${item.placa},${item.nome},${item.tipo},${item.rgcpf},${item.data},${item.status},${item.horarioEntrada || '-'},${item.horarioSaida || '-'}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historico-${dataTexto}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  alert("Exportado com sucesso!");
}

// ===== Exportaçao PDF =====
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const tabela = document.getElementById("listaHistorico");
  if (tabela.innerHTML.trim() === "") { alert("NÃ£o hÃ¡ dados para exportar!"); return; }

  doc.setFontSize(14);
  doc.text("HistÃ³rico de Placas", 105, 15, null, null, "center");

  let y = 20;
  const rows = tabela.querySelectorAll(".item");
  rows.forEach((row) => {
    doc.setFontSize(12);
    doc.text(row.innerText.split("\n").join(" | "), 10, y);
    y += 8;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  const dataHoje = new Date().toISOString().split("T")[0];
  doc.save(`historico-${dataHoje}.pdf`);
}



// ===== Entrada/Saida de placas =====
function verificarPlaca() {
  const placaInput = document.getElementById("placaInput");
  const placa = placaInput.value.toUpperCase();
  placaInput.value = placa;

  if (placa.length !== 7) { 
    alert("A placa deve ter exatamente 7 caracteres!"); 
    placaInput.value = ""; 
    placaInput.focus(); 
    return; 
  }

  const autorizado = bancoAutorizados.find(i => i.placa === placa);
  if (autorizado) {
    mostrarPopup(`
      <h3>AUTORIZADO âœ…</h3>
      <p><b>Nome:</b> ${autorizado.nome}</p>
      <p><b>Placa:</b> ${autorizado.placa}</p>
      <p><b>Modelo:</b> ${autorizado.modelo || '-'}</p>
      <p><b>Cor:</b> ${autorizado.cor || '-'}</p>
      <button class="entrada" onclick="fecharPopup()">OK</button>
    `);
  } else {
    const registro = bancoCadastros.find(i => i.placa === placa);
    const ultimoHistorico = [...bancoHistorico].reverse().find(h => h.placa === placa);
    const statusAtual = ultimoHistorico ? ultimoHistorico.status : "-";
    const cor = statusAtual === "Em andamento" ? "red" : statusAtual === "Finalizado" ? "green" : "black";

    if (registro) {
      mostrarPopup(`
        <h3>Placa encontrada âœ…</h3>
        <p><b>Placa:</b> ${placa}</p>
        <p><b>Nome:</b> ${registro.nome}</p>
        <p><b>RG/CPF:</b> ${registro.rgcpf}</p>
        <p><b>Status:</b><span style="color:${cor}">${statusAtual}</span></p>
        <label>Tipo:</label>
        <select id="tipoEntrada">
          <option value="Despacho" ${registro.tipo === "Despacho" ? "selected" : ""}>Despacho</option>
          <option value="Retiro" ${registro.tipo === "Retiro" ? "selected" : ""}>Retiro</option>
        </select>
        <br><br>
        <button class="entrada" onclick="marcarEntradaComTipo('${placa}')">Entrada</button>
        <button class="saida" onclick="marcarSaida('${placa}')">Saida</button>
      `);
    } else {
      mostrarPopup(`
        <h3>Placa nÃ£o registrada âš ï¸</h3>
        <input type="text" id="nomeInput" placeholder="Nome">
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

// Nova funÃ§Ã£o para registrar entrada com tipo selecionado
function marcarEntradaComTipo(placa) {
  const tipoSelecionado = document.getElementById("tipoEntrada").value;
  const existe = [...bancoHistorico].reverse().find(h => h.placa === placa && h.status === "Em andamento");
  if (existe) { alert("Essa placa jÃ¡ estÃ¡ em andamento!"); return; }

  const cadastro = bancoCadastros.find(i => i.placa === placa) || bancoAutorizados.find(i => i.placa === placa);
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
    horarioSaida: ""
  });

  salvarBanco();
  fecharPopup();
  alert("Entrada registrada com sucesso! âœ…");
}


function entradaNovaPlaca(placa) {
  const nome = document.getElementById("nomeInput").value;
  const rgcpf = document.getElementById("rgcpfInput").value;
  const tipo = document.getElementById("tipoInput").value;
  if (!nome || !rgcpf || !tipo || !placa) { alert("Preencha todos os campos!"); return; }
  const hoje = formatarData(new Date());
  bancoCadastros.push({ nome, placa, rgcpf, tipo });
  bancoHistorico.push({ nome, placa, rgcpf, tipo, status: "Em andamento", data: hoje, horarioEntrada: new Date().toLocaleTimeString(), horarioSaida: "" });
  salvarBanco(); fecharPopup(); alert("Entrada registrada com sucesso! âœ…");
}

function marcarEntrada(placa) {
  const existe = [...bancoHistorico].reverse().find(h => h.placa === placa && h.status === "Em andamento");
  if (existe) { alert("Essa placa jÃ¡ estÃ¡ em andamento!"); return; }
  const cadastro = bancoCadastros.find(i => i.placa === placa) || bancoAutorizados.find(i => i.placa === placa);
  if (!cadastro) return;
  const hoje = formatarData(new Date());
  bancoHistorico.push({ nome: cadastro.nome, placa: cadastro.placa, rgcpf: cadastro.rgcpf, tipo: cadastro.tipo || "Autorizado", status: "Em andamento", data: hoje, horarioEntrada: new Date().toLocaleTimeString(), horarioSaida: "" });
  salvarBanco(); fecharPopup();
}

function marcarSaida(placa) {
  const ultimo = [...bancoHistorico].reverse().find(h => h.placa === placa && h.status === "Em andamento");
  if (!ultimo) return;
  ultimo.status = "Finalizado"; ultimo.horarioSaida = new Date().toLocaleTimeString();
  salvarBanco(); document.getElementById("mensagem").innerHTML = "SaÃ­da registrada com sucesso! âœ…";
  setTimeout(() => { document.getElementById("mensagem").innerHTML = ""; }, 5000); fecharPopup();
}

// ===== Popup e menu =====
function mostrarPopup(c) {
  document.getElementById("popupConteudo").innerHTML = c;
  document.getElementById("overlay").style.display = "block";
  document.getElementById("popupCard").style.display = "block";
}

function fecharPopup() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("popupCard").style.display = "none";
}

function toggleMenu() { document.getElementById("menu").classList.toggle("menu-open"); }
function mostrarPagina(p) {
  ["inicioContainer","cadastroContainer","autorizadosContainer","historicoContainer"].forEach(id => document.getElementById(id).style.display = "none");
  document.getElementById(p).style.display = "block";
  if(p==='historicoContainer'&&!document.getElementById("dataFiltro").value){
    const hoje = new Date();
    document.getElementById("dataFiltro").value = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;
    filtrarHistorico();
  }
}

// ===== Limpar historico com senha =====
function limparTudo() {
  let senha = prompt("Digite a senha para limpar os dados:");
  if (senha === "1234") {
    if (confirm("Deseja realmente limpar o histÃ³rico e mensagens?")) {
      bancoHistorico = [];
      localStorage.setItem("bancoHistorico", JSON.stringify(bancoHistorico));
      document.getElementById("mensagem").innerHTML = "";
      atualizarTabelaAndamento();
      filtrarHistorico();
      alert("HistÃ³rico e mensagens foram limpos!");
    }
  } else if (senha !== null) { alert("Senha incorreta âŒ"); }
}



// Botão para enviar manualmente o histórico de HOJE
async function enviarEmailOntem() { // mantém o nome da função igual
  const hoje = new Date();
  const dataHoje = formatarData(hoje);
  const filtered = bancoHistorico.filter(item => item.data === dataHoje);
  if (filtered.length === 0) {
    alert("Nenhum histórico encontrado para hoje!");
    return;
  }

  let mensagem = "📌 Histórico de Placas - " + dataHoje + "\n\n";
  filtered.forEach(item => {
    mensagem += `🚗 Placa: ${item.placa} | 👤 Nome: ${item.nome} | 🏷 Tipo: ${item.tipo} | 🆔 RG/CPF: ${item.rgcpf} | 📍 Status: ${item.status} | ⏰ Entrada: ${item.horarioEntrada || "-"} | ⏱ Saída: ${item.horarioSaida || "-"}\n`;
  });

  try {
    const anexo = await gerarAnexoWordHoje(); // usa a função de HOJE
    await Email.send({
      SecureToken: SMTP_SECURE_TOKEN,
      To: "leomatos3914@gmail.com",
      From: SMTP_FROM,
      Subject: "Histórico Diário (Envio Manual de Hoje)",
      Body: mensagem.replace(/\n/g, "<br>"),
      Attachments: [anexo]
    });
    alert("📧 Histórico de hoje enviado manualmente com sucesso!");
  } catch (err) {
    alert("❌ Erro ao enviar: " + err.message);
  }
}
// Envia histórico do dia anterior por e-mail automatico
async function enviarHistoricoDiaAnterior() {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const dataOntem = formatarData(ontem);

  const filtered = bancoHistorico.filter(item => item.data === dataOntem);
  if (filtered.length === 0) return;

  let mensagem = "📌 Histórico de Placas - " + dataOntem + "\n\n";
  filtered.forEach(item => {
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
      Attachments: [anexo]
    });

    console.log("✅ Histórico de " + dataOntem + " enviado por e-mail.");
    localStorage.setItem("ultimoDiaEnviado", dataOntem);
  } catch (err) {
    console.error("❌ Erro no envio automático:", err);
  }
}

// marca que foi enviado hoje
function marcarEnvio() {
  localStorage.setItem("emailEnviadoHoje", formatarData(new Date()));
}
// Verifica diariamente se precisa enviar o histórico do dia anterior
function verificarEnvioDiario() {
  const agora = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const dataOntem = formatarData(ontem);

  const ultimoDiaEnviado = localStorage.getItem("ultimoDiaEnviado");

  // Se já mandou o relatório de ontem, não repete
  if (ultimoDiaEnviado === dataOntem) return;

  // Se já passou da meia-noite, pode enviar o de ontem
  if (agora.getHours() >= 0) {
    enviarHistoricoDiaAnterior();
  }
}

// verifica a cada minuto -> dispara se nao enviado
setInterval(verificarEnvioDiario, 60 * 1000);


// ===== ExportaÃ§Ã£o automÃ¡tica 24h =====
function checarExportacaoAutomaticaPDF() {
  const agora = new Date();
  const ultimaExportacao = localStorage.getItem("ultimaExportacao");
  let dataInicio;

  if (ultimaExportacao) {
    const ultima = new Date(ultimaExportacao);
    const diff = agora - ultima;
    const horas24 = 24 * 60 * 60 * 1000;
    if (diff >= horas24) { dataInicio = ultima; } else { return; }
  } else { dataInicio = new Date(agora.getTime() - 24 * 60 * 60 * 1000); }

  const historicoFiltrado = bancoHistorico.filter(item => {
    const [dia, mes, ano] = item.data.split("/").map(Number);
    const dataItem = new Date(ano, mes - 1, dia);
    return dataItem > dataInicio;
  });

  if (historicoFiltrado.length === 0) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("HistÃ³rico de Placas", 105, 15, null, null, "center");

  let y = 25;
  doc.setFontSize(12);
  historicoFiltrado.forEach(item => {
    doc.text(`Placa: ${item.placa} | Nome: ${item.nome} | Tipo: ${item.tipo} | RG/CPF: ${item.rgcpf} | Data: ${item.data} | Status: ${item.status}`, 10, y);
    y += 8;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  const dataHoje = new Date().toISOString().split("T")[0];
  doc.save(`historico-${dataHoje}.pdf`);
  localStorage.setItem("ultimaExportacao", agora.toISOString());
  console.log("ExportaÃ§Ã£o automÃ¡tica em PDF realizada!");
}

// ===== EXPORTAçaO LOCALSTORAGE =====
function exportLocalStorage() {
    return JSON.stringify({
        bancoCadastros,
        bancoHistorico,
        bancoAutorizados
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

// ===== BOTÃƒO EXPORTAR =====
function criarBotaoExportLS() {
    const btn = document.createElement("button");
    btn.textContent = "Exportar LS";
    btn.style = "padding:5px 10px; margin:5px; cursor:pointer; background:#2196F3; color:white; border:none; border-radius:5px;";
    btn.addEventListener("click", () => {
        downloadLS();
        localStorage.setItem("lastLSBackup", Date.now().toString());
        alert("Backup exportado!");
    });
    document.getElementById("historicoContainer").insertBefore(btn, null);
}
criarBotaoExportLS();

// ===== BOTÃO IMPORTAR =====
const importInput = document.createElement("input");
importInput.type = "file";
importInput.accept = ".json";
importInput.style.display = "none";
document.body.appendChild(importInput);

const importBtn = document.createElement("button");
importBtn.textContent = "Importar LS";
importBtn.style = "padding:5px 10px; margin:5px; cursor:pointer;";
document.getElementById("historicoContainer").appendChild(importBtn);

importBtn.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const dados = JSON.parse(e.target.result);
            const chaves = ["bancoCadastros","bancoHistorico","bancoAutorizados"];
            if (!chaves.every(k => dados.hasOwnProperty(k))) {
                alert("Arquivo invÃ¡lido!");
                return;
            }

            // Atualiza localStorage e arrays
            chaves.forEach(k => localStorage.setItem(k, JSON.stringify(dados[k])));
            bancoCadastros = dados.bancoCadastros;
            bancoHistorico = dados.bancoHistorico;
            bancoAutorizados = dados.bancoAutorizados;

            salvarBanco(); // atualiza tela
            alert("Backup importado com sucesso!");
            importInput.value = ""; // permite reimportar mesmo arquivo
        } catch (err) {
            console.error(err);
            alert("Erro ao importar arquivo!");
        }
    };
    reader.readAsText(file);
});

// --- GARANTE QUE A BIB docx ESTEJA CARREGADA (funciona no mobile e GitHub Pages) ---
function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Falha ao carregar: '+src));
    document.head.appendChild(s);
  });
}
async function ensureDocx(){
  if (window.docx) return window.docx;
  const cdns = [
    'https://cdn.jsdelivr.net/npm/docx@6.1.5/build/index.js',
    'https://unpkg.com/docx@6.1.5/build/index.js'
  ];
  for (const url of cdns){
    try { await loadScript(url); if (window.docx) return window.docx; } catch(_){}
  }
  throw new Error('Biblioteca docx indisponível');
}




// ===== InicializaÃ§Ã£o =====
mostrarPagina('inicioContainer');
salvarBanco();
window.addEventListener("load", checarExportacaoAutomaticaPDF);
