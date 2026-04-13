
function calculateStrainModels(
    matA1Name, matB1Name, x1, t1, // Liga 1 e espessura 1 (nm)
    matA2Name, matB2Name, x2, t2, // Liga 2 e espessura 2 (nm)
    temperature, substrateName
) {
    // 1. Função auxiliar para calcular o Lattice Parameter de um ternário em dada T
    const getTernaryLatticeT = (matAName, matBName, x) => {
        const dataA = semiconductorData.binaries[matAName];
        const dataB = semiconductorData.binaries[matBName];
        if (!dataA || !dataB) return null;

        const xA = 1 - x;
        const xB = x;

        const lat300 = xA * dataA["LatticePar (A)"] + xB * dataB["LatticePar (A)"];
        if (!lat300) return null;

        const alphaA = dataA["alpha_T (10^-6 K^-1)"] || 0;
        const alphaB = dataB["alpha_T (10^-6 K^-1)"] || 0;
        const alpha = xA * alphaA + xB * alphaB;

        return lat300 * (1 + alpha * (temperature - 300) * 1e-6);
    };

    // 2. Extração dos Parâmetros Base (a1, a2, a_sub, A1, A2)
    const a1 = getTernaryLatticeT(matA1Name, matB1Name, x1);
    const a2 = getTernaryLatticeT(matA2Name, matB2Name, x2);
    const a_sub = calculateLatticeParameter(substrateName, temperature);

    if (!a1 || !a2 || !a_sub) {
        return { error: "Parâmetros de rede insuficientes para as ligas ou substrato." };
    }

    const elastic1 = calculateTernaryElastic(matA1Name, matB1Name, x1);
    const elastic2 = calculateTernaryElastic(matA2Name, matB2Name, x2);

    if (elastic1.error || elastic2.error) {
        return { error: "Erro ao buscar as constantes elásticas das ligas." };
    }

    const A1 = parseFloat(elastic1.A);
    const A2 = parseFloat(elastic2.A);

    if (isNaN(A1) || isNaN(A2)) {
        return { error: "Dados elásticos insuficientes para aplicar os modelos ponderados (Falta C11/C12)." };
    }

    if (t1 + t2 === 0) {
        return { error: "A espessura total não pode ser zero." };
    }

    // --- 3. Cálculos dos Modelos (Lattice Parameters) ---

    // Modelo 1: Average Lattice
    const a_avg = (t1 * a1 + t2 * a2) / (t1 + t2);

    // Modelo 2: Thickness Weighted Lattice
    const a_tw = ((A1 * t1 + A2 * t2) * a1 * a2) / (A1 * t1 * a2 + A2 * t2 * a1);

    // Modelo 3: Zero Stress Lattice
    const a_zs = (A1 * t1 * a1 * Math.pow(a2, 2) + A2 * t2 * a2 * Math.pow(a1, 2)) /
                 (A1 * t1 * Math.pow(a2, 2) + A2 * t2 * Math.pow(a1, 2));


    // --- 4. Cálculos de Strain (ppm) em relação ao Substrato ---
    
    const calcStrain = (a_model) => (1 - a_model / a_sub) * 1e6;

    const strain_avg = calcStrain(a_avg);
    const strain_tw = calcStrain(a_tw);
    const strain_zs = calcStrain(a_zs);

    // 5. Retorno do Objeto Formatado
    return {
        alloy1Name: elastic1.alloyName,
        alloy2Name: elastic2.alloyName,
        substrateLatticeT: a_sub.toFixed(6),
        modelsLattice: {
            average: a_avg.toFixed(6),
            thicknessWeighted: a_tw.toFixed(6),
            zeroStress: a_zs.toFixed(6)
        },
        modelsStrainPPM: {
            average: strain_avg.toFixed(2),
            thicknessWeighted: strain_tw.toFixed(2),
            zeroStress: strain_zs.toFixed(2)
        }
    };
}
