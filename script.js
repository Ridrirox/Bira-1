const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyOc0T5QWkSABJ_jjzzZW_RiG9decKTeVI_icVrz758LEWUjNpKbdvpxIDMNY__trTr_A/exec';
const SENHA_MESTRE = '1313'; // Defina aqui a senha desejada para autorizar as alterações
let dadosGlobais = []; 

async function carregarDados() {
    try {
        const response = await fetch(WEB_APP_URL);
        dadosGlobais = await response.json();
        
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        
        dadosGlobais.forEach((item, index) => {
            const vaga = item['Vaga'] || 'Não atribuída';
            const gabinete = item['Gabinete / Desembargador'] || '';
            const linkMapa = item['Mapa'] || item['LinkMapa'] || '';
            const linkMag = item['Foto'] || item['LinkMag'] || '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${gabinete}</td>
                <td><input type="text" class="table-input" id="vaga_${index}" value="${item['Vaga'] || ''}"></td>
                <td><input type="text" class="table-input" id="veiculo_${index}" value="${item['Veículo'] || ''}"></td>
                <td><input type="text" class="table-input" id="placa_${index}" value="${item['Placa'] || ''}"></td>
                <td>
                    <button class="btn-acao" onclick='solicitarSenhaESalvar(${item.rowNumber}, ${index}, this)'>Guardar</button>
                    <button class="btn-mapa" onclick='mostrarMapa(${index}, "${vaga}", "${gabinete}", ${JSON.stringify(linkMapa)})'>Ver Mapa</button>
                    <button class="btn-mapa" onclick='mostrarMagistrado("${vaga}", "${gabinete}", ${JSON.stringify(linkMag)})'>Ver Magistrado</button> 
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('garageTable').style.display = ''; 
    } catch (error) {
        document.getElementById('loading').innerText = 'Erro ao carregar dados: ' + error;
    }
}

// Função para filtrar a tabela
function filtrarTabela() {
    const input = document.getElementById("campoPesquisa");
    const filter = input.value.toUpperCase();
    const table = document.getElementById("garageTable");
    const tr = table.getElementsByTagName("tr");

    // Percorre todas as linhas da tabela (ignorando o cabeçalho)
    for (let i = 1; i < tr.length; i++) {
        const tdGabinete = tr[i].getElementsByTagName("td")[0];
        const inputVaga = tr[i].getElementsByTagName("td")[1].querySelector("input");
        const inputVeiculo = tr[i].getElementsByTagName("td")[2].querySelector("input");
        const inputPlaca = tr[i].getElementsByTagName("td")[3].querySelector("input");

        if (tdGabinete) {
            const textoGabinete = tdGabinete.textContent || tdGabinete.innerText;
            const textoVaga = inputVaga ? inputVaga.value : "";
            const textoVeiculo = inputVeiculo ? inputVeiculo.value : "";
            const textoPlaca = inputPlaca ? inputPlaca.value : "";
            
            const textoLinha = textoGabinete + " " + textoVaga + " " + textoVeiculo + " " + textoPlaca;

            if (textoLinha.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function solicitarSenhaESalvar(rowNumber, index, buttonElement) {
    const senhaDigitada = prompt('Digite a senha para guardar as alterações:');
    if (senhaDigitada === null) return; // Cancelado

    if (senhaDigitada !== SENHA_MESTRE) {
        alert('Senha incorreta! Alteração não autorizada.');
        return;
    }

    salvarLinha(rowNumber, index, buttonElement);
}

async function salvarLinha(rowNumber, index, buttonElement) {
    const payload = {
        rowNumber: rowNumber,
        Vaga: document.getElementById(`vaga_${index}`).value,
        Veículo: document.getElementById(`veiculo_${index}`).value,
        Placa: document.getElementById(`placa_${index}`).value
    };

    try {
        buttonElement.innerText = 'A guardar...';
        buttonElement.disabled = true;
        
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        alert(result.message);
        buttonElement.innerText = 'Guardar';
        buttonElement.disabled = false;
    } catch (error) {
        alert('Erro ao guardar: ' + error);
        buttonElement.innerText = 'Guardar';
        buttonElement.disabled = false;
    }
}

let currentItemIndex = null;

function mostrarMapa(index, vaga, gabinete, linkMapa) {
    currentItemIndex = index;
    document.getElementById('modalTitle').innerText = 'Vaga: ' + vaga;
    document.getElementById('modalSubTitle').innerText = gabinete;
    document.getElementById('uploadStatus').innerText = '';
    
    const container = document.getElementById('mapPreviewContainer');
    container.innerHTML = ''; 

    if (linkMapa && linkMapa.trim() !== '') {
        const img = document.createElement('img');
        img.src = linkMapa;
        img.alt = 'Mapa da Vaga ' + vaga;
        img.onerror = function() {
            container.innerHTML = '<p style="color: #d9534f; padding: 20px;">Erro ao carregar a imagem do mapa. Verifique o link fornecido.</p>';
        };
        container.appendChild(img);
    } else {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p style="font-size: 1.1em; font-weight: bold; color: #3B5998;">Vaga ${vaga}</p>
                <p style="color: #777; font-size: 0.9em;">Nenhuma imagem de mapa guardada na planilha. Utilize o botão abaixo para enviar.</p>
            </div>
        `;
    }
    
    document.getElementById('mapModal').style.display = 'flex';
} 

function mostrarMagistrado(vaga, gabinete, linkMag) {
    document.getElementById('modalTitle').innerText = 'Vaga: ' + vaga;
    document.getElementById('modalSubTitle').innerText = gabinete;
    
    const container = document.getElementById('mapPreviewContainer');
    container.innerHTML = ''; 

    if (linkMag && linkMag.trim() !== '') {
        const img = document.createElement('img');
        img.src = linkMag;
        img.alt = 'Mostra Magistrado ' + vaga;
        img.onerror = function() {
            container.innerHTML = '<p style="color: #d9534f; padding: 20px;">Erro ao carregar a imagem do magistrado. Verifique o link fornecido na planilha.</p>';
        };
        container.appendChild(img);
    } else {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p style="font-size: 1.1em; font-weight: bold; color: #3B5998;">Vaga ${vaga}</p>
                <p style="color: #777; font-size: 0.9em;">Nenhum link de imagem do magistrado foi adicionado na coluna correspondente desta linha no Excel/Planilha.</p>
            </div>
        `;
    }
    
    document.getElementById('mapModal').style.display = 'flex';
}

function _acionarUploadComSenha() {
    const senhaDigitada = prompt('Digite a senha para enviar e salvar a imagem na planilha:');
    if (senhaDigitada === null) return; 

    if (senhaDigitada !== SENHA_MESTRE) {
        alert('Senha incorreta! Envio não autorizado.');
        return;
    }

    document.getElementById('fileInputMapa').click();
}

function verificarSenhaEEnviarImagem(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const statusEl = document.getElementById('uploadStatus');
    const btnUpload = document.getElementById('btnUpload');
    
    statusEl.innerText = 'A processar e a enviar imagem para a planilha...';
    btnUpload.disabled = true;

    reader.onload = async function(e) {
        const base64Image = e.target.result; 
        const item = dadosGlobais[currentItemIndex];

        const payload = {
            rowNumber: item.rowNumber,
            Vaga: document.getElementById(`vaga_${currentItemIndex}`).value,
            Veículo: document.getElementById(`veiculo_${currentItemIndex}`).value,
            Placa: document.getElementById(`placa_${currentItemIndex}`).value,
            Mapa: base64Image 
        };

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            statusEl.innerText = 'Imagem guardada com sucesso na planilha!';
            btnUpload.disabled = false;
            
            const container = document.getElementById('mapPreviewContainer');
            container.innerHTML = '';
            const img = document.createElement('img');
            img.src = base64Image;
            container.appendChild(img);

            dadosGlobais[currentItemIndex]['Mapa'] = base64Image;

        } catch (error) {
            statusEl.innerText = 'Erro ao enviar imagem: ' + error;
            btnUpload.disabled = false;
        }
    };

    reader.readAsDataURL(file);
}

function fecharMapa() {
    document.getElementById('mapModal').style.display = 'none';
    document.getElementById('fileInputMapa').value = ''; 
    carregarDados(); 
}

window.onclick = function(event) {
    const modal = document.getElementById('mapModal');
    if (event.target == modal) {
        fecharMapa();
    }
}

// Inicia o carregamento dos dados
carregarDados();