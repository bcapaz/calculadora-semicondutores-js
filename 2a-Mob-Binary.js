
function calculateBinaryMobility(materialName, temperature, dopingLevel) {
    const data = semiconductorData.binaries[materialName];
    if (!data) return { error: "Material base não encontrado no banco de dados." };

    // Função interna para calcular mobilidade (Electron ou Hole)
    const getMobility = (type, N) => {
        const isElec = (type === 'electron');
        
        // Parâmetros base do Data1
        const u_max_300 = isElec ? data["u_max_electron (cm2/Vs)"] : data["u_max_hole (cm2/Vs)"];
        const u_min = isElec ? data["u_min_electron (cm2/Vs)"] : data["u_min_hole (cm2/Vs)"];
        const N_ref_300 = isElec ? data["N_ref_electron (cm-3)"] : data["N_ref_hole (cm-3)"];
        const lambda = isElec ? data["lambda_electron"] : data["lambda_hole"];
        const theta1 = isElec ? data["theta1_electron"] : data["theta1_hole"]; // Exp. p/ u_max
        const theta2 = isElec ? data["theta2_electron"] : data["theta2_hole"]; // Exp. p/ N_ref

        // Verifica estritamente se há dados faltantes (null/undefined)
        if (u_max_300 == null || u_min == null || N_ref_300 == null || lambda == null || theta1 == null || theta2 == null) {
            return null;
        }

        // Ajuste pela Temperatura (Leis de Potência)
        const u_max_T = u_max_300 * Math.pow(300 / temperature, theta1);
        const N_ref_T = N_ref_300 * Math.pow(temperature / 300, theta2);

        // Evita divisões indesejadas caso N_ref_T calcule para 0
        if (N_ref_T === 0) return null;

        // Fórmula de Caughey-Thomas
        const mobility = u_min + (u_max_T - u_min) / (1 + Math.pow(N / N_ref_T, lambda));
        
        return mobility;
    };

    // 1. Mobilidade @ 300K @ 1e18 (Valores diretos da planilha ou calculados)
    const mobElec300_1e18 = data["mob_electron_300K_1E18 (cm2/Vs)"];
    const mobHole300_1e18 = data["mob_hole_300K_1E18 (cm2/Vs)"];

    // 2. Mobilidade @ T @ 1e18
    const mobElecT_1e18 = getMobility('electron', 1e18);
    const mobHoleT_1e18 = getMobility('hole', 1e18);

    // 3. Mobilidade @ T @ N (Doping informado)
    const mobElecT_N = getMobility('electron', dopingLevel);
    const mobHoleT_N = getMobility('hole', dopingLevel);

    // Retorna o objeto formatado
    return {
        at300K_1e18: {
            electron: mobElec300_1e18 != null ? mobElec300_1e18.toFixed(2) : "N/A",
            hole: mobHole300_1e18 != null ? mobHole300_1e18.toFixed(2) : "N/A"
        },
        atT_1e18: {
            electron: mobElecT_1e18 != null ? mobElecT_1e18.toFixed(2) : "N/A",
            hole: mobHoleT_1e18 != null ? mobHoleT_1e18.toFixed(2) : "N/A"
        },
        atT_N: {
            electron: mobElecT_N != null ? mobElecT_N.toFixed(2) : "N/A",
            hole: mobHoleT_N != null ? mobHoleT_N.toFixed(2) : "N/A"
        }
    };
}
