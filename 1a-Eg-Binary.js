
// 1. Cálculo do Parâmetro de Rede em função da Temperatura
function calculateLatticeParameter(materialName, temperature) {
    // 1º passo: Tentar encontrar nos binários
    const data = semiconductorData.binaries[materialName];
    
    if (data && data["LatticePar (A)"]) {
        const a300 = data["LatticePar (A)"];
        // Se não houver alpha (alguns materiais não têm), assume 0
        const alpha = data["alpha_T (10^-6 K^-1)"] || 0; 
        return a300 * (1 + alpha * (temperature - 300) * 1e-6);
    }
    
    // Se não for um binário, tentar encontrar nos substratos genéricos 
    const subPar = semiconductorData.substrates[materialName];
    if (subPar) {
        return subPar; // Retorna o valor fixo a 300K
    }

    return null;
}

// 2. Cálculo de Bandgap por Varshni
function calculateEgVarshni(materialName, temperature) {
    const data = semiconductorData.binaries[materialName];
    if (!data) return null;

    const calculateVal = (Eg0, a, b) => {
        if (!Eg0 || !a || !b) return Infinity;
        return Eg0 - (a * 1e-3 * Math.pow(temperature, 2)) / (b + temperature);
    };

    const EgG = calculateVal(data["EgG (eV)"], data["aG (meV/K)"], data["bG (K)"]);
    const EgX = calculateVal(data["EgX (eV)"], data["aX (meV/K)"], data["bX (K)"]);
    const EgL = calculateVal(data["EgL (eV)"], data["aL (meV/K)"], data["bL (K)"]);

    const minEg = Math.min(EgG, EgX, EgL);
    
    // Evita que materiais sem dados retornem 'Infinity'
    return minEg === Infinity ? "Not enough data" : minEg;
}

// 3. Calculadora Principal (Exporta os resultados)
function calculateEgBinaryAnalysis(materialName, substrateName, temperature) {
    const mat = semiconductorData.binaries[materialName];
    if (!mat) return { error: "Material base não encontrado no banco de dados." };

    // a) Lattice Parameters at T (agora chamamos as funções diretamente)
    const a_mat_T = calculateLatticeParameter(materialName, temperature);
    const a_sub_T = calculateLatticeParameter(substrateName, temperature);

    if (!a_mat_T || !a_sub_T) {
        return { error: "Parâmetros de rede insuficientes para este material ou substrato." };
    }

    // b) Lattice Mismatch (LMM)
    const mismatchDecimal = (a_sub_T / a_mat_T) - 1;
    const mismatchPPM = mismatchDecimal * 1e6;
    const mismatchPercent = mismatchDecimal * 100;

    // c) Eg_T Without Strain
    const egNoStrain = calculateEgVarshni(materialName, temperature);

    // d) Eg_T With Strain
    let egWithStrain = "Not enough data";
    
    const a_pot = mat["a (eV)"];
    const b_pot = mat["b (eV)"];
    const c11 = mat["C11 (10^11 dyn/cm2)"];
    const c12 = mat["C12 (10^11 dyn/cm2)"];

    if (a_pot && b_pot && c11 && c12 && typeof egNoStrain === 'number') {
        const eps_para = mismatchDecimal; 
        const eps_perp = -2 * (c12 / c11) * eps_para;
        
        const dE_hy = a_pot * (2 * eps_para + eps_perp);
        const dE_sh = b_pot * (eps_perp - eps_para);

        egWithStrain = egNoStrain + dE_hy + Math.abs(dE_sh); 
    }

    // Retorna o objeto formatado para a tela
    return {
        latticeMaterialT: a_mat_T.toFixed(6),
        latticeSubstrateT: a_sub_T.toFixed(6),
        mismatchPPM: mismatchPPM.toFixed(2),
        mismatchPercent: mismatchPercent.toFixed(4),
        egNoStrain: typeof egNoStrain === 'number' ? egNoStrain.toFixed(4) : egNoStrain,
        egWithStrain: typeof egWithStrain === 'number' ? egWithStrain.toFixed(4) : egWithStrain
    };
}
