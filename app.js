document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. LÓGICA DAS ABAS (NAVEGAÇÃO) ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const calcSections = document.querySelectorAll('.calc-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            calcSections.forEach(s => s.classList.remove('active'));
            
            // Adiciona active no clicado
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- 2. INICIALIZAÇÃO DOS DADOS (POPULAR DROPDOWNS) ---
    // Usando nosso banco de dados 'semiconductorData' do data.js
    const materialsList = Object.keys(semiconductorData.binaries);
    const substratesList = Object.keys(semiconductorData.substrates);

    const populateSelect = (selectElement, optionsList) => {
        if(!selectElement) return;
        selectElement.innerHTML = ''; // limpa
        optionsList.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            selectElement.appendChild(option);
        });
    };

    // Populando os dropdowns da Calculadora 1a
    populateSelect(document.getElementById('mat-1a'), materialsList);
    populateSelect(document.getElementById('sub-1a'), substratesList);


    // --- 3. LÓGICA DOS BOTÕES DE CÁLCULO ---

    // Calculadora 1a: Bandgap Binário
    const btn1a = document.getElementById('btn-calc-1a');
    if (btn1a) {
        btn1a.addEventListener('click', () => {
            const material = document.getElementById('mat-1a').value;
            const substrate = document.getElementById('sub-1a').value;
            const temp = parseFloat(document.getElementById('temp-1a').value);

            // Chama a função global que criamos no arquivo 1a-Eg-Binary.js
            const result = calculateEgBinaryAnalysis(material, substrate, temp);

            const resPanel = document.getElementById('res-1a');
            const resGrid = document.getElementById('res-grid-1a');

            if (result.error) {
                resGrid.innerHTML = `<div class="res-item" style="color: red;"><strong>Erro</strong><span>${result.error}</span></div>`;
            } else {
                // Monta os bloquinhos de resultado dinamicamente
                resGrid.innerHTML = `
                    <div class="res-item"><strong>Lattice Par. (T)</strong><span>${result.latticeMaterialT} Å</span></div>
                    <div class="res-item"><strong>Lattice Sub. (T)</strong><span>${result.latticeSubstrateT} Å</span></div>
                    <div class="res-item"><strong>Mismatch (LMM)</strong><span>${result.mismatchPPM} ppm (${result.mismatchPercent}%)</span></div>
                    <div class="res-item"><strong>Eg (No Strain)</strong><span>${result.egNoStrain} eV</span></div>
                    <div class="res-item"><strong>Eg (With Strain)</strong><span>${result.egWithStrain} eV</span></div>
                `;
            }
            resPanel.style.display = 'block'; // Mostra a div de resultados
        });
    }

});
