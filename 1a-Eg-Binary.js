
// 1. Cálculo do Parâmetro de Rede
function calculateLatticeParameter(materialName, temperature) {
    let a300 = null;
    let alpha = 0;

    const binData = semiconductorData.binaries[materialName];
    if (binData && binData["LatticePar (A)"]) {
        a300 = binData["LatticePar (A)"];
        alpha = binData["alpha_T (10^-6 K^-1)"] || 0;
    } else {
        a300 = semiconductorData.substrates[materialName];
    }

    if (!a300) return null;
    return a300 * (1 + alpha * (temperature - 300) * 1e-6);
}

// 2. Cálculo de Bandgap por Varshni
function calculateEgVarshni(materialName, temperature) {
    const data = semiconductorData.binaries[materialName];
    if (!data) return null;

    const calculateVal = (Eg0, a, b) => {
        if (Eg0 == null || a == null || b == null) return Infinity;
        return Eg0 - (a * 1e-3 * Math.pow(temperature, 2)) / (b + temperature);
    };

    const EgG = calculateVal(data["EgG (eV)"], data["aG (meV/K)"], data["bG (K)"]);
    const EgX = calculateVal(data["EgX (eV)"], data["aX (meV/K)"], data["bX (K)"]);
    const EgL = calculateVal(data["EgL (eV)"], data["aL (meV/K)"], data["bL (K)"]);

    const minEg = Math.min(EgG, EgX, EgL);
    return minEg === Infinity ? "Not enough data" : minEg;
}

// 3. Calculadora Principal
function calculateEgBinaryAnalysis(materialName, substrateName, temperature) {
    const mat = semiconductorData.binaries[materialName];
    if (!mat) return { error: "Material base não encontrado no banco de dados." };

    const a_mat_T = calculateLatticeParameter(materialName, temperature);
    const a_sub_T = calculateLatticeParameter(substrateName, temperature);

    if (!a_mat_T || !a_sub_T) {
        return { error: "Parâmetros de rede insuficientes para este material ou substrato." };
    }

    // LMM: (a_mat / a_sub) - 1
    const mismatchDecimal = (a_mat_T / a_sub_T) - 1;
    const mismatchPPM = mismatchDecimal * 1e6;
    const mismatchPercent = mismatchDecimal * 100;

    const egNoStrain = calculateEgVarshni(materialName, temperature);

    let egWithStrain = "Not enough data";
    
    const a_pot = mat["a (eV)"];
    const c11 = mat["C11 (10^11 dyn/cm2)"];
    const c12 = mat["C12 (10^11 dyn/cm2)"];

    if (a_pot != null && c11 != null && c12 != null && typeof egNoStrain === 'number') {
        
        
        const termo1 = 1 - (c12 / c11);
        const termo2 = a_pot * (1 + 2 * (c12 / c11));
        
        // mismatchDecimal é exatamente o $C$14/100 da sua planilha
        const dE = mismatchDecimal * (-2 * a_pot) * (termo1 + termo2);
        
        egWithStrain = egNoStrain + dE; 
    }

    return {
        latticeMaterialT: a_mat_T.toFixed(6),
        latticeSubstrateT: a_sub_T.toFixed(6),
        mismatchPPM: mismatchPPM.toFixed(2),
        mismatchPercent: mismatchPercent.toFixed(4),
        egNoStrain: typeof egNoStrain === 'number' ? egNoStrain.toFixed(6) : egNoStrain,
        egWithStrain: typeof egWithStrain === 'number' ? egWithStrain.toFixed(6) : egWithStrain
    };
}
