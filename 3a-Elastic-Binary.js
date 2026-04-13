

function calculateBinaryElastic(materialName) {
    const data = semiconductorData.binaries[materialName];
    
    // Padrão de erro unificado
    if (!data) {
        return { error: "Material base não encontrado no banco de dados." };
    }

    const c11 = data["C11 (10^11 dyn/cm2)"];
    const c12 = data["C12 (10^11 dyn/cm2)"];

    // Validação rigorosa: verifica se os dados existem e evita divisão por zero
    if (c11 == null || c12 == null || c11 === 0) {
        return {
            c11: c11 != null ? c11.toFixed(2) : "N/A",
            c12: c12 != null ? c12.toFixed(2) : "N/A",
            A: "Not enough data"
        };
    }

    /**
     * Cálculo do parâmetro elástico A
     */
    const A = c11 + c12 - (2 * Math.pow(c12, 2) / c11);

    return {
        c11: c11.toFixed(2),
        c12: c12.toFixed(2),
        A: A.toFixed(4)
    };
}
