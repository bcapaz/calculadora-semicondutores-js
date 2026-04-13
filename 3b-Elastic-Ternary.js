
function calculateTernaryElastic(matAName, matBName, x) {
    const xA = 1 - x;
    const xB = x;

    // 1. Nome da Liga
    const alloyName = `${matAName}_(${xA.toFixed(2)})${matBName}_(${xB.toFixed(2)})`;

    // 2. Calcula as constantes elásticas dos materiais base
    const elasticA = calculateBinaryElastic(matAName);
    const elasticB = calculateBinaryElastic(matBName);

    // Validação unificada de erros
    if (!elasticA || elasticA.error) return { error: `Erro no material A: ${elasticA ? elasticA.error : "Desconhecido"}` };
    if (!elasticB || elasticB.error) return { error: `Erro no material B: ${elasticB ? elasticB.error : "Desconhecido"}` };

    // 3. Extração segura dos valores de 'A'
    const valA = parseFloat(elasticA.A);
    const valB = parseFloat(elasticB.A);

    // Se algum dos materiais base não tiver dados suficientes (retornando NaN no parseFloat)
    if (isNaN(valA) || isNaN(valB)) {
        return {
            alloyName: alloyName,
            A: "Not enough data"
        };
    }

    // 4. Interpolação Linear (Lei de Vegard direta no parâmetro A)
    const alloyA = (xA * valA) + (xB * valB);

    // Retorna o objeto formatado
    return {
        alloyName: alloyName,
        A: alloyA.toFixed(4)
    };
}
