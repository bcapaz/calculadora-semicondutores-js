

function calculateTernaryMobility(matAName, matBName, x, temperature, dopingLevel) {
    const xA = 1 - x;
    const xB = x;

    // 1. Nome da Liga
    const alloyName = `${matAName}_(${xA.toFixed(2)})${matBName}_(${xB.toFixed(2)})`;

    // 2. Calcula mobilidade dos dois materiais base
    const mobA = calculateBinaryMobility(matAName, temperature, dopingLevel);
    const mobB = calculateBinaryMobility(matBName, temperature, dopingLevel);

    // Validação de erros vindos da calculadora binária (novo padrão)
    if (!mobA || mobA.error) return { error: `Erro no material A: ${mobA ? mobA.error : "Desconhecido"}` };
    if (!mobB || mobB.error) return { error: `Erro no material B: ${mobB ? mobB.error : "Desconhecido"}` };

    // Função auxiliar para interpolar de forma segura, evitando "NaN" na interface
    const interpolate = (valA, valB) => {
        if (valA === "N/A" || valB === "N/A" || valA == null || valB == null) return "N/A";
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (isNaN(numA) || isNaN(numB)) return "N/A";
        return (xA * numA + xB * numB).toFixed(2);
    };

    // 3. Interpolação Linear (Lei de Vegard) para todos os cenários
    
    // @ 300K @ 1e18
    const alloyElec300 = interpolate(mobA.at300K_1e18.electron, mobB.at300K_1e18.electron);
    const alloyHole300 = interpolate(mobA.at300K_1e18.hole, mobB.at300K_1e18.hole);

    // @ T @ 1e18
    const alloyElecT_1e18 = interpolate(mobA.atT_1e18.electron, mobB.atT_1e18.electron);
    const alloyHoleT_1e18 = interpolate(mobA.atT_1e18.hole, mobB.atT_1e18.hole);

    // @ T @ N (Doping informado)
    const alloyElecT_N = interpolate(mobA.atT_N.electron, mobB.atT_N.electron);
    const alloyHoleT_N = interpolate(mobA.atT_N.hole, mobB.atT_N.hole);

    // 4. Retorna o objeto formatado
    return {
        alloyName,
        at300K_1e18: {
            electron: alloyElec300,
            hole: alloyHole300
        },
        atT_1e18: {
            electron: alloyElecT_1e18,
            hole: alloyHoleT_1e18
        },
        atT_N: {
            electron: alloyElecT_N,
            hole: alloyHoleT_N
        },
        components: {
            matA: mobA.atT_N,
            matB: mobB.atT_N
        }
    };
}
