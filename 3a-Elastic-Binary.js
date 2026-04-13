
const ElasticCalculators = {

    calculateBinaryElastic: function(materialName) {
        const data = semiconductorData.binaries[materialName];
        if (!data) return "Material não encontrado";

        const c11 = data["C11 (10^11 dyn/cm2)"];
        const c12 = data["C12 (10^11 dyn/cm2)"];

        // Se não houver dados elásticos, não há como calcular A
        if (!c11 || !c12) {
            return {
                c11: "N/A",
                c12: "N/A",
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
};
