
// Função auxiliar interna para calcular a equação de Varshni para um vale específico
function getValleyEgT(mat, valley, temperature) {
    if (!mat) return null;
    const Eg0 = mat[`Eg${valley} (eV)`];
    const a = mat[`a${valley} (meV/K)`];
    const b = mat[`b${valley} (K)`];
    if (Eg0 == null || a == null || b == null) return null;
    return Eg0 - (a * 1e-3 * Math.pow(temperature, 2)) / (b + temperature);
}

// Calculadora Principal
function calculateEgTernaryAnalysis(matAName, matBName, x, temperature, substrateName) {
    const matA = semiconductorData.binaries[matAName];
    const matB = semiconductorData.binaries[matBName];
    
    if (!matA || !matB) return { error: "Materiais base não encontrados no banco de dados." };

    const xA = 1 - x;
    const xB = x;

    // 1. Nome da Liga
    const alloyName = `${matAName}_(${xA.toFixed(2)})${matBName}_(${xB.toFixed(2)})`;

    // 2. Parâmetro de Rede da Liga e do Substrato
    const latA_300 = matA["LatticePar (A)"];
    const latB_300 = matB["LatticePar (A)"];
    if (!latA_300 || !latB_300) return { error: "Parâmetros de rede insuficientes nos materiais base." };

    const lat_alloy_300 = xA * latA_300 + xB * latB_300;
    const alphaA = matA["alpha_T (10^-6 K^-1)"] || 0;
    const alphaB = matB["alpha_T (10^-6 K^-1)"] || 0;
    const alpha_alloy = xA * alphaA + xB * alphaB;
    
    const lat_alloy_T = lat_alloy_300 * (1 + alpha_alloy * (temperature - 300) * 1e-6);

    // Usa a função do 1a-Eg-Binary para garantir a lógica correta (incluindo substratos "Other")
    const lat_sub_T = calculateLatticeParameter(substrateName, temperature);
    if (!lat_sub_T) return { error: "Substrato inválido ou sem parâmetro de rede." };

    // 3. Lattice Mismatch (LMM)
    const mismatchDecimal = (lat_sub_T / lat_alloy_T) - 1;
    const mismatchPPM = mismatchDecimal * 1e6;
    const mismatchPercent = mismatchDecimal * 100;

    // 4. Afinidade Eletrônica (com proteção contra valores nulos)
    const chiA = matA["Electron_Affinity (eV)"];
    const chiB = matB["Electron_Affinity (eV)"];
    const chi_alloy = (chiA != null && chiB != null) ? (xA * chiA + xB * chiB) : null;

    // 5. Bandgaps dos Vales (Com Bowing)
    const bowingKey = `${matAName}${matBName}`; 
    const altBowingKey = `${matBName}${matAName}`; // Busca invertida como fallback
    const bowingData = semiconductorData.ternary_bowing[bowingKey] || semiconductorData.ternary_bowing[altBowingKey] || { bowing: { EgG: 0, EgX: 0, EgL: 0 } };
    
    const calculateBowing = (val) => {
        if (typeof val === 'string') {
            // Lida com fórmulas como "-0.127+1.31*x_Al" substituindo o 'x_alguma_coisa'
            let parsedVal = val.replace(',', '.').replace(/x_[a-zA-Z]+/g, xB); 
            try { return eval(parsedVal); } catch(e) { return 0; }
        }
        return val || 0;
    };

    const bowG = calculateBowing(bowingData.bowing.EgG);
    const bowX = calculateBowing(bowingData.bowing.EgX);
    const bowL = calculateBowing(bowingData.bowing.EgL);

    const egGA = getValleyEgT(matA, 'G', temperature);
    const egGB = getValleyEgT(matB, 'G', temperature);
    const egXA = getValleyEgT(matA, 'X', temperature);
    const egXB = getValleyEgT(matB, 'X', temperature);
    const egLA = getValleyEgT(matA, 'L', temperature);
    const egLB = getValleyEgT(matB, 'L', temperature);

    const egG_alloy = (egGA != null && egGB != null) ? (xA * egGA + xB * egGB - xA * xB * bowG) : null;
    const egX_alloy = (egXA != null && egXB != null) ? (xA * egXA + xB * egXB - xA * xB * bowX) : null;
    const egL_alloy = (egLA != null && egLB != null) ? (xA * egLA + xB * egLB - xA * xB * bowL) : null;

    // Bandgap Fundamental (Menor valor válido)
    const validGaps = [egG_alloy, egX_alloy, egL_alloy].filter(v => v !== null);
    const egNoStrain = validGaps.length > 0 ? Math.min(...validGaps) : "Not enough data";
    const isDirect = (egNoStrain === egG_alloy);

    // 6. Offsets (CBO e VBO) em relação ao substrato
    const sub = semiconductorData.binaries[substrateName] || {};
    const chi_sub = sub["Electron_Affinity (eV)"];
    const eg_sub = getValleyEgT(sub, 'G', temperature); 

    let cbo = "N/A";
    let vbo = "N/A";
    if (chi_alloy != null && chi_sub != null) {
        cbo = chi_sub - chi_alloy;
        if (egNoStrain !== "Not enough data" && eg_sub != null) {
            vbo = (chi_alloy + egNoStrain) - (chi_sub + eg_sub);
        }
    }

    // 7. Eg com Strain
    let egWithStrain = "Not enough data";
    const c11A = matA["C11 (10^11 dyn/cm2)"];
    const c11B = matB["C11 (10^11 dyn/cm2)"];
    const c12A = matA["C12 (10^11 dyn/cm2)"];
    const c12B = matB["C12 (10^11 dyn/cm2)"];
    const a_potA = matA["a (eV)"];
    const a_potB = matB["a (eV)"];
    const b_potA = matA["b (eV)"];
    const b_potB = matB["b (eV)"];

    if (c11A && c11B && c12A && c12B && a_potA && a_potB && b_potA && b_potB && typeof egNoStrain === 'number') {
        const c11 = xA * c11A + xB * c11B;
        const c12 = xA * c12A + xB * c12B;
        const a_pot = xA * a_potA + xB * a_potB;
        const b_pot = xA * b_potA + xB * b_potB;

        const eps_para = mismatchDecimal;
        const eps_perp = -2 * (c12 / c11) * eps_para;
        const dE_hy = a_pot * (2 * eps_para + eps_perp);
        const dE_sh = b_pot * (eps_perp - eps_para);
        egWithStrain = egNoStrain + dE_hy + Math.abs(dE_sh);
    }

    // Retorna o objeto formatado
    return {
        alloyName,
        mismatchPPM: mismatchPPM.toFixed(2),
        mismatchPercent: mismatchPercent.toFixed(4),
        electronAffinity: chi_alloy != null ? chi_alloy.toFixed(3) : "N/A",
        cbo: typeof cbo === 'number' ? cbo.toFixed(3) : cbo,
        vbo: typeof vbo === 'number' ? vbo.toFixed(3) : vbo,
        egNoStrain: typeof egNoStrain === 'number' ? egNoStrain.toFixed(4) : egNoStrain,
        egWithStrain: typeof egWithStrain === 'number' ? egWithStrain.toFixed(4) : egWithStrain,
        egG: egG_alloy != null ? egG_alloy.toFixed(4) : "N/A",
        egX: egX_alloy != null ? egX_alloy.toFixed(4) : "N/A",
        egL: egL_alloy != null ? egL_alloy.toFixed(4) : "N/A",
        nature: typeof egNoStrain === 'number' ? (isDirect ? "Direct bandgap" : "Indirect bandgap") : "N/A"
    };
}
