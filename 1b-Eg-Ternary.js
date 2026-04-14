

// Dicionário para garantir que ligas invertidas achem o Bowing correto
const bowingMap = {
    "GaAsInAs": "InGaAs", "InAsGaAs": "InGaAs",
    "AlAsGaAs": "AlGaAs", "GaAsAlAs": "AlGaAs",
    "InAsAlAs": "InAlAs", "AlAsInAs": "InAlAs",
    "InPGaP": "InGaP", "GaPInP": "InGaP",
    "InPAlP": "InAlP", "AlPInP": "InAlP",
    "AlPGaP": "AlGaP", "GaPAlP": "AlGaP",
    "InSbGaSb": "InGaSb", "GaSbInSb": "InGaSb",
    "AlSbInSb": "AlInSb", "InSbAlSb": "AlInSb",
    "AlSbGaSb": "AlGaSb", "GaSbAlSb": "AlGaSb",
    "GaAsGaSb": "GaAsSb", "GaSbGaAs": "GaAsSb",
    "InAsInSb": "InAsSb", "InSbInAs": "InAsSb",
    "AlAsAlSb": "AlAsSb", "AlSbAlAs": "AlAsSb",
    "GaAsGaP": "GaAsP", "GaPGaAs": "GaAsP",
    "InAsInP": "InAsP", "InPInAs": "InAsP",
    "AlAsAlP": "AlAsP", "AlPAlAs": "AlAsP"
};

// Função Varshni blindada contra valores nulos
function getValleyEgT(mat, valley, temperature) {
    if (!mat) return null;
    const Eg0 = parseFloat(mat[`Eg${valley} (eV)`]);
    if (isNaN(Eg0)) return null;
    
    const a = parseFloat(mat[`a${valley} (meV/K)`]);
    const b = parseFloat(mat[`b${valley} (K)`]);
    
    // Se a ou b não existem no Data1 (ex: GaP), retorna o Eg sem shift térmico
    if (isNaN(a) || isNaN(b)) return Eg0;
    
    return Eg0 - (a * 1e-3 * Math.pow(temperature, 2)) / (b + temperature);
}

// Calculadora Principal 1b
function calculateEgTernaryAnalysis(matAName, matBName, x, temperature, substrateName) {
    const matA = semiconductorData.binaries[matAName];
    const matB = semiconductorData.binaries[matBName];
    if (!matA || !matB) return { error: "Materiais base não encontrados." };

    const xA = 1 - x;
    const xB = x;
    const alloyName = `${matAName}_(${xA.toFixed(2)})${matBName}_(${xB.toFixed(2)})`;

    // 1. Parâmetro de Rede
    const latA = parseFloat(matA["LatticePar (A)"]);
    const latB = parseFloat(matB["LatticePar (A)"]);
    if (isNaN(latA) || isNaN(latB)) return { error: "Parâmetros de rede insuficientes." };

    const lat_alloy_300 = xA * latA + xB * latB;
    const alphaA = parseFloat(matA["alpha_T (10^-6 K^-1)"]) || 0;
    const alphaB = parseFloat(matB["alpha_T (10^-6 K^-1)"]) || 0;
    const alpha_alloy = xA * alphaA + xB * alphaB;
    const lat_alloy_T = lat_alloy_300 * (1 + alpha_alloy * (temperature - 300) * 1e-6);

    const lat_sub_T = calculateLatticeParameter(substrateName, temperature);
    if (!lat_sub_T) return { error: "Substrato inválido." };

    // 2. Mismatch (LMM) e Fator de Strain
    const eps_para = (lat_sub_T - lat_alloy_T) / lat_alloy_T;
    const mismatchDecimal = (lat_sub_T / lat_alloy_T) - 1; 
    const mismatchPPM = mismatchDecimal * 1e6;
    const mismatchPercent = mismatchDecimal * 100;

    // 3. Afinidade Eletrônica
    const chiA = parseFloat(matA["Electron_Affinity (eV)"]);
    const chiB = parseFloat(matB["Electron_Affinity (eV)"]);
    const chi_alloy = (!isNaN(chiA) && !isNaN(chiB)) ? (xA * chiA + xB * chiB) : null;

    // 4. Bowing Parameters
    const bowKeyStr = bowingMap[`${matAName}${matBName}`] || `${matAName}${matBName}`;
    const bowingData = semiconductorData.ternary_bowing[bowKeyStr] || { bowing: { EgG: 0, EgX: 0, EgL: 0 } };
    
    const calculateBowing = (val) => {
        if (typeof val === 'string') {
            let parsedVal = val.replace(',', '.').replace(/x_[a-zA-Z]+/g, xB); 
            try { return eval(parsedVal); } catch(e) { return 0; }
        }
        return val || 0;
    };

    const bowG = calculateBowing(bowingData.bowing.EgG);
    const bowX = calculateBowing(bowingData.bowing.EgX);
    const bowL = calculateBowing(bowingData.bowing.EgL);

    // 5. Interpolação Física dos Vales
    const egGA = getValleyEgT(matA, 'G', temperature);
    const egGB = getValleyEgT(matB, 'G', temperature);
    const egXA = getValleyEgT(matA, 'X', temperature);
    const egXB = getValleyEgT(matB, 'X', temperature);
    const egLA = getValleyEgT(matA, 'L', temperature);
    const egLB = getValleyEgT(matB, 'L', temperature);

    const egG_alloy = (egGA != null && egGB != null) ? (xA * egGA + xB * egGB - xA * xB * bowG) : null;
    const egX_alloy = (egXA != null && egXB != null) ? (xA * egXA + xB * egXB - xA * xB * bowX) : null;
    const egL_alloy = (egLA != null && egLB != null) ? (xA * egLA + xB * egLB - xA * xB * bowL) : null;

    const validGaps = [egG_alloy, egX_alloy, egL_alloy].filter(v => v !== null);
    const egNoStrain = validGaps.length > 0 ? Math.min(...validGaps) : "Not enough data";
    const isDirect = (egNoStrain === egG_alloy);

    // 6. Offsets (CBO e VBO)
    const sub = semiconductorData.binaries[substrateName] || {};
    const chi_sub = parseFloat(sub["Electron_Affinity (eV)"]);
    const eg_sub = getValleyEgT(sub, 'G', temperature); 

    let cbo = "N/A";
    let vbo = "N/A";
    if (chi_alloy != null && !isNaN(chi_sub)) {
        cbo = chi_sub - chi_alloy;
        if (egNoStrain !== "Not enough data" && eg_sub != null) {
            vbo = (chi_alloy + egNoStrain) - (chi_sub + eg_sub);
        }
    }

    // 7. Strain Correction (Pikus-Bir Física Correta)
    let egWithStrain = "Not enough data";
    const c11A = parseFloat(matA["C11 (10^11 dyn/cm2)"]);
    const c11B = parseFloat(matB["C11 (10^11 dyn/cm2)"]);
    const c12A = parseFloat(matA["C12 (10^11 dyn/cm2)"]);
    const c12B = parseFloat(matB["C12 (10^11 dyn/cm2)"]);
    const a_potA = parseFloat(matA["a (eV)"]);
    const a_potB = parseFloat(matB["a (eV)"]);
    const b_potA = parseFloat(matA["b (eV)"]);
    const b_potB = parseFloat(matB["b (eV)"]);

    if (!isNaN(c11A) && !isNaN(c11B) && !isNaN(c12A) && !isNaN(c12B) && !isNaN(a_potA) && !isNaN(a_potB) && typeof egNoStrain === 'number') {
        const c11 = xA * c11A + xB * c11B;
        const c12 = xA * c12A + xB * c12B;
        const a_pot = xA * a_potA + xB * a_potB;
        const b_pot = xA * b_potA + xB * b_potB;

        const dE_hy = 2 * a_pot * (1 - c12 / c11) * eps_para;
        const dE_sh = b_pot * (1 + 2 * (c12 / c11)) * eps_para;
        
        egWithStrain = egNoStrain + dE_hy - Math.abs(dE_sh);
    }

    return {
        alloyName,
        mismatchPPM: mismatchPPM.toFixed(2),
        mismatchPercent: mismatchPercent.toFixed(4),
        electronAffinity: chi_alloy != null ? chi_alloy.toFixed(4) : "N/A",
        cbo: typeof cbo === 'number' ? cbo.toFixed(4) : cbo,
        vbo: typeof vbo === 'number' ? vbo.toFixed(4) : vbo,
        egNoStrain: typeof egNoStrain === 'number' ? egNoStrain.toFixed(6) : egNoStrain,
        egWithStrain: typeof egWithStrain === 'number' ? egWithStrain.toFixed(6) : egWithStrain,
        egG: egG_alloy != null ? egG_alloy.toFixed(4) : "N/A",
        egX: egX_alloy != null ? egX_alloy.toFixed(4) : "N/A",
        egL: egL_alloy != null ? egL_alloy.toFixed(4) : "N/A",
        nature: typeof egNoStrain === 'number' ? (isDirect ? "Direct bandgap" : "Indirect bandgap") : "N/A"
    };
}
