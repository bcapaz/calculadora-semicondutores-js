
// Adicionando ao objeto MobilityCalculators já existente
MobilityCalculators.calculateTernaryMobility = function(matAName, matBName, x, temperature, dopingLevel) {
    const xA = 1 - x;
    const xB = x;

    // 1. Nome da Liga
    const alloyName = `${matAName}_(${xA.toFixed(2)})${matBName}_(${xB.toFixed(2)})`;

    // 2. Calculamos as mobilidades dos binários separadamente usando a função 2a
    // Precisamos dos resultados @ T @ N (Doping informado)
    const mobA = this.calculateBinaryMobility(matAName, temperature, dopingLevel);
    const mobB = this.calculateBinaryMobility(matBName, temperature, dopingLevel);

    if (typeof mobA === 'string' || typeof mobB === 'string') {
        return "Erro: Um dos materiais base não possui dados de mobilidade.";
    }

    // 3. Interpolação Linear (Fórmulas da planilha: xA * MobA + xB * MobB)
    // Nota: Convertemos de string (toFixed) para float para o cálculo
    const mobElec_alloy = xA * parseFloat(mobA.atT_N.electron) + xB * parseFloat(mobB.atT_N.electron);
    const mobHole_alloy = xA * parseFloat(mobA.atT_N.hole) + xB * parseFloat(mobB.atT_N.hole);

    return {
        alloyName,
        atT_N: {
            electron: mobElec_alloy.toFixed(2),
            hole: mobHole_alloy.toFixed(2)
        },
        components: {
            matA: mobA.atT_N,
            matB: mobB.atT_N
        }
    };
};
