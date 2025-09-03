// ===== Banco de dados local =====
let bancoCadastros = JSON.parse(localStorage.getItem("bancoCadastros")) || [];
let bancoHistorico = JSON.parse(localStorage.getItem("bancoHistorico")) || [];
let bancoAutorizados = JSON.parse(localStorage.getItem("bancoAutorizados")) || [];

// ===== Salvar banco =====
function salvarBanco() {
  localStorage.setItem("bancoCadastros", JSON.stringify(bancoCadastros));
  localStorage.setItem("bancoHistorico", JSON.stringify(bancoHistorico));
  localStorage.setItem("bancoAutorizados", JSON.stringify(bancoAutorizados));
  atualizarCadastros();
  atualizarTabelaAndamento();
  atualizarAutorizados();
}

// ===== Atualização de listas =====
function atualizarCadastros() {
  const listaDiv = document.getElementById("listaCadastros");
  listaDiv.innerHTML = "";
  cadastroSelecionado = null; // limpa seleção ao atualizar

  bancoCadastros.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <span><b>${item.placa}</b> - ${item.nome} [${item.tipo}] - RG/CPF: ${item.rgcpf}</span>
      <span class="menuSerra">⋮
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
      document.querySelectorAll(".submenu").forEach(s => s.style.display = "none");
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

// ===== CRUD autorizados =====
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

function iniciarEdicaoAut() {
  if (autorizadoSelecionado === null) { alert("Selecione um autorizado para editar!"); return; }
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
  document.querySelectorAll("#listaAutorizados .item").forEach(el => el.classList.remove("selecionado"));
  autorizadoSelecionado = null;
}

function iniciarExclusaoAut() {
  if (autorizadoSelecionado === null) { alert("Selecione um autorizado para excluir!"); return; }
  const index = autorizadoSelecionado;
  if (confirm(`Deseja realmente excluir ${bancoAutorizados[index].nome}?`)) {
    bancoAutorizados.splice(index, 1);
    autorizadoSelecionado = null;
    salvarBanco();
    alert("Autorizado excluído com sucesso!");
  }
}

// ===== CRUD cadastros =====
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

// ===== Funções de data =====
function formatarData(d) { const dia = String(d.getDate()).padStart(2, '0'); const mes = String(d.getMonth() + 1).padStart(2, '0'); return `${dia}/${mes}/${d.getFullYear()}`; }
function converterDataInput(input) { const p = input.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }

// ===== Histórico =====
function filtrarHistorico() {
  const input = document.getElementById("dataFiltro").value;
  const dataFiltro = input ? converterDataInput(input) : formatarData(new Date());
  const listaDiv = document.getElementById("listaHistorico");
  listaDiv.innerHTML = "";
  bancoHistorico.filter(i => i.data === dataFiltro).forEach(item => {
    let cor = item.status === "Em andamento" ? "red" : item.status === "Finalizado" ? "green" : "black";
    listaDiv.innerHTML += `<div class="item"><b>${item.placa}</b> - ${item.nome} [${item.tipo}] - RG/CPF: ${item.rgcpf}<br>Data:${item.data}<br>Status:<span style="color:${cor}">${item.status}</span><br>Entrada:<span class="horaEntrada">${item.horarioEntrada || "-"}</span>|Saída:<span class="horaSaida">${item.horarioSaida || "-"}</span></div>`;
  });
}

// ===== Exportação CSV =====
function exportarCSV() {
  const dataFiltro = document.getElementById("dataFiltro").value;
  const dataTexto = dataFiltro ? converterDataInput(dataFiltro) : formatarData(new Date());
  const filtered = bancoHistorico.filter(item => item.data === dataTexto);
  if (filtered.length === 0) { alert("Nenhum dado para exportar."); return; }

  let csv = "Placa,Nome,Tipo,RG/CPF,Data,Status,Entrada,Saída\n";
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

// ===== Exportação PDF =====
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const tabela = document.getElementById("listaHistorico");
  if (tabela.innerHTML.trim() === "") { alert("Não há dados para exportar!"); return; }
  doc.setFontSize(14);
  doc.text("Histórico de Placas", 105, 15, null, null, "center");
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

// ===== Enviar e-mail com Resend =====
async function enviarEmailResend(manual = false) {
  const hoje = formatarData(new Date());
  const filtered = bancoHistorico.filter(item => item.data === hoje);

  if (filtered.length === 0) {
    if (manual) alert("Nenhum histórico encontrado para hoje!");
    return;
  }

  // Gera PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Histórico de Placas - " + hoje, 105, 15, null, null, "center");

  let y = 25;
  filtered.forEach((item, i) => {
    doc.setFontSize(11);
    doc.text(
      `${i+1}) Placa: ${item.placa} | Nome: ${item.nome} | Tipo: ${item.tipo} | RG/CPF: ${item.rgcpf} | Status: ${item.status} | Entrada: ${item.horarioEntrada || "-"} | Saída: ${item.horarioSaida || "-"}`,
      10, y
    );
    y += 8;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  const pdfBase64 = doc.output("datauristring").split(",")[1];

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer re_CwVPZD8e_ETt6qFzphxRCn5AAhLugKtJ9",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Controle de Placas <onboarding@resend.dev>",
        to: "leomatos3914@gmail.com",
        subject: manual ? "Histórico Diário (Envio Manual)" : "Histórico Diário",
        html: "<p>Segue em anexo o histórico de placas do dia.</p>",
        attachments: [
          {
            filename: `historico-${hoje}.pdf`,
            content: pdfBase64,
            type: "application/pdf"
          }
        ]
      })
    });

    if (response.ok) {
      if (manual) alert("📧 Histórico enviado manualmente com sucesso!");
      else console.log("✅ Histórico diário enviado automaticamente!");
      marcarEnvio();
    } else {
      const err = await response.text();
      alert("❌ Erro ao enviar: " + err);
    }
  } catch (err) {
    alert("❌ Erro ao enviar: " + err.message);
  }
}

// Botão manual
function enviarEmail() { enviarEmailResend(true); }
// Automático
function enviarHistoricoDiario() { enviarEmailResend(false); }

// ===== Entrada/Saída de placas =====
// ... (resto do teu código continua igual até o fim) ...


// ===== Entrada/Saída de placas =====
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
      <h3>AUTORIZADO ✅</h3>
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
        <h3>Placa encontrada ✅</h3>
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
        <button class="saida" onclick="marcarSaida('${placa}')">Saída</button>
      `);
    } else {
      mostrarPopup(`
        <h3>Placa não registrada ⚠️</h3>
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

// Nova função para registrar entrada com tipo selecionado
function marcarEntradaComTipo(placa) {
  const tipoSelecionado = document.getElementById("tipoEntrada").value;
  const existe = [...bancoHistorico].reverse().find(h => h.placa === placa && h.status === "Em andamento");
  if (existe) { alert("Essa placa já está em andamento!"); return; }

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
  alert("Entrada registrada com sucesso! ✅");
}


function entradaNovaPlaca(placa) {
  const nome = document.getElementById("nomeInput").value;
  const rgcpf = document.getElementById("rgcpfInput").value;
  const tipo = document.getElementById("tipoInput").value;
  if (!nome || !rgcpf || !tipo || !placa) { alert("Preencha todos os campos!"); return; }
  const hoje = formatarData(new Date());
  bancoCadastros.push({ nome, placa, rgcpf, tipo });
  bancoHistorico.push({ nome, placa, rgcpf, tipo, status: "Em andamento", data: hoje, horarioEntrada: new Date().toLocaleTimeString(), horarioSaida: "" });
  salvarBanco(); fecharPopup(); alert("Entrada registrada com sucesso! ✅");
}

function marcarEntrada(placa) {
  const existe = [...bancoHistorico].reverse().find(h => h.placa === placa && h.status === "Em andamento");
  if (existe) { alert("Essa placa já está em andamento!"); return; }
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
  salvarBanco(); document.getElementById("mensagem").innerHTML = "Saída registrada com sucesso! ✅";
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

// ===== Limpar histórico com senha =====
function limparTudo() {
  let senha = prompt("Digite a senha para limpar os dados:");
  if (senha === "1234") {
    if (confirm("Deseja realmente limpar o histórico e mensagens?")) {
      bancoHistorico = [];
      localStorage.setItem("bancoHistorico", JSON.stringify(bancoHistorico));
      document.getElementById("mensagem").innerHTML = "";
      atualizarTabelaAndamento();
      filtrarHistorico();
      alert("Histórico e mensagens foram limpos!");
    }
  } else if (senha !== null) { alert("Senha incorreta ❌"); }
}

// ===== Exportação automática 24h =====
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
  doc.text("Histórico de Placas", 105, 15, null, null, "center");

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
  console.log("Exportação automática em PDF realizada!");
}

// ===== EXPORTAÇÃO LOCALSTORAGE =====
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

// ===== BOTÃO EXPORTAR =====
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
                alert("Arquivo inválido!");
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


// Horário configurado para envio (pode mudar aqui)
const horaEnvio = 18;
const minutoEnvio = 30;

// Verifica se já enviou hoje
function jaEnviouHoje() {
  const ultimoEnvio = localStorage.getItem("ultimoEnvio");
  const hoje = formatarData(new Date());
  return ultimoEnvio === hoje;
}

// Salva que já enviou hoje
function marcarEnvio() {
  const hoje = formatarData(new Date());
  localStorage.setItem("ultimoEnvio", hoje);
}



// ===== Inicialização =====
mostrarPagina('inicioContainer');
salvarBanco();
window.addEventListener("load", checarExportacaoAutomaticaPDF);

