
const TernaryCalculators = {

    getTernaryAnalysis: function(matAName, matBName, x, temperature, substrateName) {
        const matA = semiconductorData.binaries[matAName];
        const matB = semiconductorData.binaries[matBName];
        const sub = semiconductorData.binaries[substrateName] || { "LatticePar (A)": semiconductorData.substrates[substrateName] };
        
        if (!matA || !matB) return "Materiais base não encontrados";

        const xA = 1 - x;
        const xB = x;

        // 1. Nome da Liga (Ex: GaAs_(0.95)InAs_(0.05))
        const alloyName = `${matAName}_(${xA.toFixed(2)})${matBName}_(${xB.toFixed(2)})`;

        // 2. Parâmetro de Rede da Liga (Vegard) a 300K
        const lat_alloy_300 = xA * matA["LatticePar (A)"] + xB * matB["LatticePar (A)"];
        
        // Interpolação do Alpha de Expansão Térmica para calcular a T definida
        const alpha_alloy = xA * matA["alpha_T (10^-6 K^-1)"] + xB * matB["alpha_T (10^-6 K^-1)"];
        const lat_alloy_T = lat_alloy_300 * (1 + alpha_alloy * (temperature - 300) * 1e-6);

        // Parâmetro de rede do substrato a T definida
        const alpha_sub = sub["alpha_T (10^-6 K^-1)"] || 0; 
        const lat_sub_T = sub["LatticePar (A)"] * (1 + alpha_sub * (temperature - 300) * 1e-6);

        // 3. Lattice Mismatch (LMM)
        const mismatchDecimal = (lat_sub_T / lat_alloy_T) - 1;
        const mismatchPPM = mismatchDecimal * 1e6;
        const mismatchPercent = mismatchDecimal * 100;

        // 4. Afinidade Eletrônica (Electron Affinity) - Interpolação linear
        const chi_alloy = xA * matA["Electron_Affinity (eV)"] + xB * matB["Electron_Affinity (eV)"];

        // 5. Bandgaps dos Vales (Com Bowing)
        // Função auxiliar para Varshni nos binários primeiro
        const getEgT = (mat, valley) => {
            const Eg0 = mat[`Eg${valley} (eV)`];
            const a = mat[`a${valley} (meV/K)`];
            const b = mat[`b${valley} (K)`];
            if (!Eg0) return null;
            return Eg0 - (a * 1e-3 * Math.pow(temperature, 2)) / (b + temperature);
        };

        // Recuperar Bowing Parameters (se houver fórmula ou valor fixo)
        const bowingKey = `${matAName}${matBName}`; // Ex: AlGaAs
        const bowingData = semiconductorData.ternary_bowing[bowingKey] || { bowing: { EgG: 0, EgX: 0, EgL: 0 } };
        
        const calculateBowing = (val) => {
            if (typeof val === 'string') {
                // Caso especial AlGaAs: "-0,127+1,31*x_Al"
                return eval(val.replace(',', '.').replace('x_Al', xB));
            }
            return val || 0;
        };

        const egG_alloy = xA * getEgT(matA, 'G') + xB * getEgT(matB, 'G') - xA * xB * calculateBowing(bowingData.bowing.EgG);
        const egX_alloy = xA * getEgT(matA, 'X') + xB * getEgT(matB, 'X') - xA * xB * calculateBowing(bowingData.bowing.EgX);
        const egL_alloy = xA * getEgT(matA, 'L') + xB * getEgT(matB, 'L') - xA * xB * calculateBowing(bowingData.bowing.EgL);

        // Bandgap Fundamental (Eg_alloy)
        const egNoStrain = Math.min(egG_alloy, egX_alloy, egL_alloy);
        const isDirect = (egNoStrain === egG_alloy);

        // 6. Offsets (CBO e VBO) em relação ao substrato
        const chi_sub = sub["Electron_Affinity (eV)"] || 0;
        const eg_sub = (sub["EgG (eV)"]) ? getEgT(sub, 'G') : 0; // Simplificação para o gap do substrato

        const cbo = chi_sub - chi_alloy;
        const vbo = (chi_alloy + egNoStrain) - (chi_sub + eg_sub);

        // 7. Eg com Strain
        let egWithStrain = "Not enough data";
        const c11 = xA * matA["C11 (10^11 dyn/cm2)"] + xB * matB["C11 (10^11 dyn/cm2)"];
        const c12 = xA * matA["C12 (10^11 dyn/cm2)"] + xB * matB["C12 (10^11 dyn/cm2)"];
        const a_pot = xA * matA["a (eV)"] + xB * matB["a (eV)"];
        const b_pot = xA * matA["b (eV)"] + xB * matB["b (eV)"];

        if (c11 && c12 && a_pot && b_pot) {
            const eps_para = mismatchDecimal;
            const eps_perp = -2 * (c12 / c11) * eps_para;
            const dE_hy = a_pot * (2 * eps_para + eps_perp);
            const dE_sh = b_pot * (eps_perp - eps_para);
            egWithStrain = egNoStrain + dE_hy + Math.abs(dE_sh);
        }

        return {
            alloyName,
            mismatchPPM: mismatchPPM.toFixed(2),
            mismatchPercent: mismatchPercent.toFixed(4),
            electronAffinity: chi_alloy.toFixed(3),
            cbo: cbo.toFixed(3),
            vbo: vbo.toFixed(3),
            egNoStrain: egNoStrain.toFixed(4),
            egWithStrain: typeof egWithStrain === 'number' ? egWithStrain.toFixed(4) : egWithStrain,
            egG: egG_alloy.toFixed(4),
            egX: egX_alloy.toFixed(4),
            egL: egL_alloy.toFixed(4),
            nature: isDirect ? "Direct bandgap" : "Indirect bandgap"
        };
    }
};
