const SemiconductorCalculators = {
    
    calculateLatticeParameter: function(materialName, temperature) {
        const data = semiconductorData.binaries[materialName];
        if (!data) return null;

        const a300 = data["LatticePar (A)"];
        const alpha = data["alpha_T (10^-6 K^-1)"];
        
        return a300 * (1 + alpha * (temperature - 300) * 1e-6);
    },

    calculateEgVarshni: function(materialName, temperature) {
        const data = semiconductorData.binaries[materialName];
        if (!data) return null;

        // Calculamos para os 3 vales e pegamos o menor (bandgap fundamental)
        const calculateVal = (Eg0, a, b) => {
            if (!Eg0 || !a || !b) return Infinity;
            return Eg0 - (a * 1e-3 * Math.pow(temperature, 2)) / (b + temperature);
        };

        const EgG = calculateVal(data["EgG (eV)"], data["aG (meV/K)"], data["bG (K)"]);
        const EgX = calculateVal(data["EgX (eV)"], data["aX (meV/K)"], data["bX (K)"]);
        const EgL = calculateVal(data["EgL (eV)"], data["aL (meV/K)"], data["bL (K)"]);

        return Math.min(EgG, EgX, EgL);
    },

    // 3. Cálculo Principal
    getMaterialAnalysis: function(materialName, substrateName, temperature) {
        const mat = semiconductorData.binaries[materialName];
        const sub = semiconductorData.binaries[substrateName] || { "LatticePar (A)": semiconductorData.substrates[substrateName] };

        if (!mat || !sub) return "Material ou Substrato não encontrado";

        // a) Lattice Parameters at T
        const a_mat_T = this.calculateLatticeParameter(materialName, temperature);
        const a_sub_T = this.calculateLatticeParameter(substrateName, temperature);

        // b) Lattice Mismatch (LMM)
        // Fórmula: (a_sub / a_mat - 1)
        const mismatchDecimal = (a_sub_T / a_mat_T) - 1;
        const mismatchPPM = mismatchDecimal * 1e6;
        const mismatchPercent = mismatchDecimal * 100;

        // c) Eg_T Without Strain
        const egNoStrain = this.calculateEgVarshni(materialName, temperature);

        // d) Eg_T With Strain
        // Baseado na fórmula complexa de deformação (Shift de energia)
        let egWithStrain = "Not enough data";
        
        const a_pot = mat["a (eV)"];
        const b_pot = mat["b (eV)"];
        const c11 = mat["C11 (10^11 dyn/cm2)"];
        const c12 = mat["C12 (10^11 dyn/cm2)"];

        if (a_pot && b_pot && c11 && c12) {
            // Strain biaxial: epsilon_parallel = (a_sub - a_mat) / a_mat
            const eps_para = mismatchDecimal; 
            // epsilon_perp = -2 * (C12/C11) * epsilon_para
            const eps_perp = -2 * (c12 / c11) * eps_para;
            
            // Hydrostatic shift: dE_hy = a * (2*eps_para + eps_perp)
            const dE_hy = a_pot * (2 * eps_para + eps_perp);
            // Shear shift: dE_sh = b * (eps_perp - eps_para)
            const dE_sh = b_pot * (eps_perp - eps_para);

            // Nota: Para transições diretas (Gamma), o strain altera o gap
            // A fórmula simplificada do Excel que você passou foca no shift hidrostático e cisalhamento
            egWithStrain = egNoStrain + dE_hy + Math.abs(dE_sh); 
        }

        return {
            latticeMaterialT: a_mat_T.toFixed(6),
            latticeSubstrateT: a_sub_T.toFixed(6),
            mismatchPPM: mismatchPPM.toFixed(2),
            mismatchPercent: mismatchPercent.toFixed(4),
            egNoStrain: egNoStrain.toFixed(4),
            egWithStrain: typeof egWithStrain === 'number' ? egWithStrain.toFixed(4) : egWithStrain
        };
    }
};
