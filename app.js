
document.addEventListener('DOMContentLoaded', () => {
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const calcSections = document.querySelectorAll('.calc-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove a classe 'active' de todas as abas e seções
            tabBtns.forEach(b => b.classList.remove('active'));
            calcSections.forEach(s => s.classList.remove('active'));
            
            // Adiciona a classe 'active' à aba clicada e à seção correspondente
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // ==========================================
    // 2. INICIALIZAÇÃO DE DADOS (DROPDOWNS)
    // ==========================================
    const materialsList = Object.keys(semiconductorData.binaries);
    const substratesList = Object.keys(semiconductorData.substrates);

    // Função auxiliar para preencher os <select> dinamicamente
    const populateSelect = (selectId, optionsList) => {
        const selectEl = document.getElementById(selectId);
        if(!selectEl) return;
        selectEl.innerHTML = ''; 
        optionsList.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            selectEl.appendChild(option);
        });
    };

    // Preenchendo todos os dropdowns baseados nos IDs do HTML
    // Calculadora 1a
    populateSelect('mat-1a', materialsList);
    populateSelect('sub-1a', substratesList);
    // Calculadora 1b
    populateSelect('matA-1b', materialsList);
    populateSelect('matB-1b', materialsList);
    populateSelect('sub-1b', substratesList);
    // Calculadora 2a
    populateSelect('mat-2a', materialsList);
    // Calculadora 2b
    populateSelect('matA-2b', materialsList);
    populateSelect('matB-2b', materialsList);
    // Calculadora 3a
    populateSelect('mat-3a', materialsList);
    // Calculadora 3b
    populateSelect('matA-3b', materialsList);
    populateSelect('matB-3b', materialsList);
    // Calculadora 4
    populateSelect('matA1-4', materialsList);
    populateSelect('matB1-4', materialsList);
    populateSelect('matA2-4', materialsList);
    populateSelect('matB2-4', materialsList);
    populateSelect('sub-4', substratesList);


    // ==========================================
    // 3. FUNÇÕES AUXILIARES DE RENDERIZAÇÃO
    // ==========================================
    const renderError = (gridId, panelId, errorMsg) => {
        document.getElementById(gridId).innerHTML = `
            <div class="res-item" style="border-left: 4px solid red;">
                <strong style="color: red;">Erro</strong>
                <span style="font-size: 1rem; color: #333;">${errorMsg}</span>
            </div>`;
        document.getElementById(panelId).style.display = 'block';
    };

    const renderResult = (gridId, panelId, htmlContent) => {
        document.getElementById(gridId).innerHTML = htmlContent;
        document.getElementById(panelId).style.display = 'block';
    };


    // ==========================================
    // 4. EVENTOS DOS BOTÕES DE CÁLCULO
    // ==========================================

    // --- 1a. Bandgap Binário ---
    document.getElementById('btn-calc-1a')?.addEventListener('click', () => {
        const mat = document.getElementById('mat-1a').value;
        const sub = document.getElementById('sub-1a').value;
        const temp = parseFloat(document.getElementById('temp-1a').value);

        const res = calculateEgBinaryAnalysis(mat, sub, temp);

        if (res.error) return renderError('res-grid-1a', 'res-1a', res.error);

        renderResult('res-grid-1a', 'res-1a', `
            <div class="res-item"><strong>Lattice Material (T)</strong><span>${res.latticeMaterialT} Å</span></div>
            <div class="res-item"><strong>Lattice Substrate (T)</strong><span>${res.latticeSubstrateT} Å</span></div>
            <div class="res-item"><strong>Mismatch</strong><span>${res.mismatchPPM} ppm (${res.mismatchPercent}%)</span></div>
            <div class="res-item"><strong>Eg (No Strain)</strong><span>${res.egNoStrain} eV</span></div>
            <div class="res-item"><strong>Eg (With Strain)</strong><span>${res.egWithStrain} eV</span></div>
        `);
    });

    // --- 1b. Bandgap Ternário ---
    document.getElementById('btn-calc-1b')?.addEventListener('click', () => {
        const matA = document.getElementById('matA-1b').value;
        const matB = document.getElementById('matB-1b').value;
        const x = parseFloat(document.getElementById('x-1b').value);
        const sub = document.getElementById('sub-1b').value;
        const temp = parseFloat(document.getElementById('temp-1b').value);

        const res = calculateEgTernaryAnalysis(matA, matB, x, temp, sub);

        if (res.error) return renderError('res-grid-1b', 'res-1b', res.error);

        renderResult('res-grid-1b', 'res-1b', `
            <div class="res-item"><strong>Alloy</strong><span style="font-size: 1rem;">${res.alloyName}</span></div>
            <div class="res-item"><strong>Mismatch</strong><span>${res.mismatchPPM} ppm</span></div>
            <div class="res-item"><strong>Nature</strong><span>${res.nature}</span></div>
            <div class="res-item"><strong>Eg (Fundamental)</strong><span>${res.egNoStrain} eV</span></div>
            <div class="res-item"><strong>Eg (With Strain)</strong><span>${res.egWithStrain} eV</span></div>
            <div class="res-item"><strong>Valleys (G, X, L)</strong><span style="font-size: 1rem;">${res.egG} | ${res.egX} | ${res.egL}</span></div>
            <div class="res-item"><strong>Offsets (CBO / VBO)</strong><span>${res.cbo} / ${res.vbo}</span></div>
        `);
    });

    // --- 2a. Mobilidade Binário ---
    document.getElementById('btn-calc-2a')?.addEventListener('click', () => {
        const mat = document.getElementById('mat-2a').value;
        const temp = parseFloat(document.getElementById('temp-2a').value);
        const dop = parseFloat(document.getElementById('dop-2a').value);

        const res = calculateBinaryMobility(mat, temp, dop);

        if (res.error) return renderError('res-grid-2a', 'res-2a', res.error);

        renderResult('res-grid-2a', 'res-2a', `
            <div class="res-item"><strong>Electrons (@ T, @ N)</strong><span>${res.atT_N.electron} cm²/Vs</span></div>
            <div class="res-item"><strong>Holes (@ T, @ N)</strong><span>${res.atT_N.hole} cm²/Vs</span></div>
            <div class="res-item"><strong>Electrons (@ T, 1e18)</strong><span>${res.atT_1e18.electron} cm²/Vs</span></div>
            <div class="res-item"><strong>Holes (@ T, 1e18)</strong><span>${res.atT_1e18.hole} cm²/Vs</span></div>
        `);
    });

    // --- 2b. Mobilidade Ternário ---
    document.getElementById('btn-calc-2b')?.addEventListener('click', () => {
        const matA = document.getElementById('matA-2b').value;
        const matB = document.getElementById('matB-2b').value;
        const x = parseFloat(document.getElementById('x-2b').value);
        const temp = parseFloat(document.getElementById('temp-2b').value);
        const dop = parseFloat(document.getElementById('dop-2b').value);

        const res = calculateTernaryMobility(matA, matB, x, temp, dop);

        if (res.error) return renderError('res-grid-2b', 'res-2b', res.error);

        renderResult('res-grid-2b', 'res-2b', `
            <div class="res-item"><strong>Alloy</strong><span style="font-size: 1rem;">${res.alloyName}</span></div>
            <div class="res-item"><strong>Alloy Electrons (@ T, @ N)</strong><span>${res.atT_N.electron} cm²/Vs</span></div>
            <div class="res-item"><strong>Alloy Holes (@ T, @ N)</strong><span>${res.atT_N.hole} cm²/Vs</span></div>
        `);
    });

    // --- 3a. Elástica Binário ---
    document.getElementById('btn-calc-3a')?.addEventListener('click', () => {
        const mat = document.getElementById('mat-3a').value;

        const res = calculateBinaryElastic(mat);

        if (res.error) return renderError('res-grid-3a', 'res-3a', res.error);

        renderResult('res-grid-3a', 'res-3a', `
            <div class="res-item"><strong>C11</strong><span>${res.c11}</span><strong style="text-transform: none;">x10¹¹ dyn/cm²</strong></div>
            <div class="res-item"><strong>C12</strong><span>${res.c12}</span><strong style="text-transform: none;">x10¹¹ dyn/cm²</strong></div>
            <div class="res-item"><strong>Elastic Parameter (A)</strong><span>${res.A}</span><strong style="text-transform: none;">x10¹¹ dyn/cm²</strong></div>
        `);
    });

    // --- 3b. Elástica Ternário ---
    document.getElementById('btn-calc-3b')?.addEventListener('click', () => {
        const matA = document.getElementById('matA-3b').value;
        const matB = document.getElementById('matB-3b').value;
        const x = parseFloat(document.getElementById('x-3b').value);

        const res = calculateTernaryElastic(matA, matB, x);

        if (res.error) return renderError('res-grid-3b', 'res-3b', res.error);

        renderResult('res-grid-3b', 'res-3b', `
            <div class="res-item"><strong>Alloy</strong><span style="font-size: 1rem;">${res.alloyName}</span></div>
            <div class="res-item"><strong>Elastic Parameter (A)</strong><span>${res.A}</span><strong style="text-transform: none;">x10¹¹ dyn/cm²</strong></div>
        `);
    });

    // --- 4. Strain Models ---
    document.getElementById('btn-calc-4')?.addEventListener('click', () => {
        const matA1 = document.getElementById('matA1-4').value;
        const matB1 = document.getElementById('matB1-4').value;
        const x1 = parseFloat(document.getElementById('x1-4').value);
        const t1 = parseFloat(document.getElementById('t1-4').value);

        const matA2 = document.getElementById('matA2-4').value;
        const matB2 = document.getElementById('matB2-4').value;
        const x2 = parseFloat(document.getElementById('x2-4').value);
        const t2 = parseFloat(document.getElementById('t2-4').value);

        const temp = parseFloat(document.getElementById('temp-4').value);
        const sub = document.getElementById('sub-4').value;

        const res = calculateStrainModels(matA1, matB1, x1, t1, matA2, matB2, x2, t2, temp, sub);

        if (res.error) return renderError('res-grid-4', 'res-4', res.error);

        renderResult('res-grid-4', 'res-4', `
            <div class="res-item" style="grid-column: 1 / -1;"><strong>Substrate Lattice (@ T)</strong><span>${res.substrateLatticeT} Å</span></div>
            
            <div class="res-item"><strong>Lattice (Average)</strong><span>${res.modelsLattice.average} Å</span></div>
            <div class="res-item"><strong>Lattice (Thick. Weighted)</strong><span>${res.modelsLattice.thicknessWeighted} Å</span></div>
            <div class="res-item"><strong>Lattice (Zero Stress)</strong><span>${res.modelsLattice.zeroStress} Å</span></div>

            <div class="res-item"><strong>Strain (Average)</strong><span>${res.modelsStrainPPM.average} ppm</span></div>
            <div class="res-item"><strong>Strain (Thick. Weighted)</strong><span>${res.modelsStrainPPM.thicknessWeighted} ppm</span></div>
            <div class="res-item"><strong>Strain (Zero Stress)</strong><span>${res.modelsStrainPPM.zeroStress} ppm</span></div>
        `);
    });

});
