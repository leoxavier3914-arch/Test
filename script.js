// ===== Banco de dados local =====
let bancoCadastros = JSON.parse(localStorage.getItem("bancoCadastros")) || [];
let bancoHistorico = JSON.parse(localStorage.getItem("bancoHistorico")) || [];
let bancoAutorizados = JSON.parse(localStorage.getItem("bancoAutorizados")) || [];

// Inicializa o EmailJS
emailjs.init("vPVpXFO3k8QblVbqr"); // substitua pelo seu user ID do EmailJS

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
  e.stopPropagation(); // não ativa seleção do item

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
    // Se já estava selecionado, desmarcar e esconder serrinha/submenu
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


function atualizarTabelaAndamento() {
  const tbody = document.getElementById("tabelaAndamento");
  tbody.innerHTML = "";
  bancoHistorico.filter(h => h.status === "Em andamento").forEach(h => {
    tbody.innerHTML += `<tr><td>${h.placa}</td><td>${h.nome}</td><td class="horaEntrada">${h.horarioEntrada}</td><td><button class="saida" onclick="marcarSaida('${h.placa}')">Saída</button></td></tr>`;
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
    autorizadoSelecionado = null; // limpa seleção
    salvarBanco();
    alert("Autorizado excluído com sucesso!");
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


// ===== Exportação PDF =====
function exportarPDF(dataHoje) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const tabela = document.getElementById("listaHistorico");
  if (tabela.innerHTML.trim() === "") { alert("Não há dados para exportar!"); return null; }

  doc.setFontSize(14);
  doc.text("Histórico de Placas", 105, 15, null, null, "center");

  // Título com data e horário
  doc.setFontSize(12);
  doc.text(`Data: ${dataHoje} | Horário: 00:00 até 23:59`, 105, 22, null, null, "center");

  let y = 30;
  const rows = tabela.querySelectorAll(".item");
  rows.forEach((row) => {
    doc.setFontSize(12);
    doc.text(row.innerText.split("\n").join(" | "), 10, y);
    y += 8;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  const pdfBlob = doc.output("blob"); // retorna blob para envio
  return pdfBlob;
}


function enviarPDFManual() {

// Pega a data do filtro (ou hoje, se vazio)
const input = document.getElementById("dataFiltro")?.value;
const dataHistorico = input ? converterDataInput(input) : formatarData(new Date());

// Gera o PDF usando a data do histórico
const pdfBlob = exportarPDF(dataHistorico);


 if (!pdfBlob) return;

  const formData = new FormData();
  formData.append("service_id", "service_t9bocqh");
  formData.append("template_id", "template_n4uw7xi");
  formData.append("user_id", "vPVpXFO3k8QblVbqr");
  formData.append("to_email", "histplacas@gmail.com");
  formData.append("title", "Histórico Diário (PDF Manual)");
  formData.append("name", "Sistema de Placas");
  formData.append("message", "Segue o histórico em PDF.");
  formData.append("files[]", pdfBlob, "historico.pdf"); // ✅ anexo real

  fetch("https://api.emailjs.com/api/v1.0/email/send-form", {
    method: "POST",
    body: formData
  })
  .then(res => res.text())
  .then(res => alert("📧 PDF enviado manualmente com sucesso!"))
  .catch(err => alert("❌ Erro ao enviar: " + err));
}



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


// ===== CONFIGURAÇÃO DE HORÁRIO =====
const horaEnvio = 23;
const minutoEnvio = 59;

// Verifica se já enviou um dia específico
function jaEnviouData(data) {
  const enviados = JSON.parse(localStorage.getItem("enviosPDF")) || [];
  return enviados.includes(data);
}

// Marca que enviou um dia específico
function marcarEnvioData(data) {
  let enviados = JSON.parse(localStorage.getItem("enviosPDF")) || [];
  if (!enviados.includes(data)) {
    enviados.push(data);
    localStorage.setItem("enviosPDF", JSON.stringify(enviados));
  }
}

// Envia PDF de um dia específico e apaga do histórico
function enviarPDFAutomaticoPorData(data) {
  const historicoDoDia = bancoHistorico.filter(h => h.data === data);
  if (historicoDoDia.length === 0) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Histórico de Placas", 105, 15, null, null, "center");

  // Título com data e horário
  doc.setFontSize(12);
  doc.text(`Data: ${data} | Horário: 00:00 até 23:59`, 105, 22, null, null, "center");

  let y = 20;
  historicoDoDia.forEach(item => {
    const texto = `${item.placa} | ${item.nome} | ${item.tipo} | ${item.status} | Entrada: ${item.horarioEntrada || "-"} | Saída: ${item.horarioSaida || "-"}`;
    doc.setFontSize(12);
    doc.text(texto, 10, y);
    y += 8;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  const pdfBlob = doc.output("blob");

  const formData = new FormData();
  formData.append("service_id", "service_t9bocqh");
  formData.append("template_id", "template_n4uw7xi");
  formData.append("user_id", "vPVpXFO3k8QblVbqr");
  formData.append("to_email", "romeikebeauty@gmail.com");
  formData.append("title", `Histórico Diário (${data})`);
  formData.append("name", "Sistema de Placas");
  formData.append("message", "Segue o histórico diário em PDF.");
  formData.append("files[]", pdfBlob, "historico.pdf");

  fetch("https://api.emailjs.com/api/v1.0/email/send-form", { method: "POST", body: formData })
    .then(() => {
      console.log(`✅ PDF do dia ${data} enviado!`);

      // Marca que já enviou
      marcarEnvioData(data);

      // Remove do histórico os registros do dia enviado
      bancoHistorico = bancoHistorico.filter(h => h.data !== data);
      localStorage.setItem("bancoHistorico", JSON.stringify(bancoHistorico));

      // Atualiza a tela
      atualizarTabelaAndamento();
      filtrarHistorico();
    })
    .catch(err => console.error("❌ Erro ao enviar PDF automático:", err));
}

// ===== FUNÇÃO DE CHECAGEM DIÁRIA =====
function verificarEnvioAutomatico() {
  const agora = new Date();
  const hoje = formatarData(agora);
  const ontem = formatarData(new Date(agora.getTime() - 24 * 60 * 60 * 1000));

  // Se não enviou ontem e há histórico, envia
  if (!jaEnviouData(ontem)) {
    enviarPDFAutomaticoPorData(ontem);
  }

  // Se já passou da hora de hoje e não enviou, envia hoje
  if (!jaEnviouData(hoje) && (agora.getHours() > horaEnvio || (agora.getHours() === horaEnvio && agora.getMinutes() >= minutoEnvio))) {
    enviarPDFAutomaticoPorData(hoje);
  }
}

// ===== EXECUTA AO ABRIR O APP =====
window.addEventListener("load", () => {
  verificarEnvioAutomatico();
});

// ===== CHECAGEM INTERVALO (a cada minuto) =====
setInterval(() => {
  const agora = new Date();
  if (agora.getHours() === horaEnvio && agora.getMinutes() === minutoEnvio) {
    verificarEnvioAutomatico();
  }
}, 60000);


// ===== Inicialização =====
mostrarPagina('inicioContainer');
salvarBanco();
