/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@Author Rafael Oliveira
 */
define(['N/search', 'N/record'], function(search, record) {

    function getInputData() { // retorna os IDs dos lançamentos com o campo: 
                              // - "SEGREGAÇÃO CURTO E LONGO PRAZO" marcado
                              // - "DATA DE REVERSÃO" vazia
        log.debug('log', 'Rodei o getInputData')
        return search.create({
            type: 'journalentry',
            filters: [
                ['custbodysegregacao_curt_long', 'IS', 'T'],
                "AND",
                ["reversaldate","isempty",""]
            ],
            columns: [
                search.createColumn({
                    name: "internalid",
                    summary: "GROUP",
                    label: "ID interno"
                 })
            ]
        })
    }

    function map(ctx) {
        var resultadoBusca = descompataJSON(ctx)
        logs(resultadoBusca)
        modificaRegistro(resultadoBusca.valor)
     
        function descompataJSON (ctx) {
            var value = ctx.value
            var parsed = JSON.parse(value)
            var valor = parsed.values['GROUP(internalid)'].value
            return {
                value: value,
                parsed: parsed,
                valor: valor
            }
        }

        function logs(resultadoBusca){
            log.debug('ctx', ctx)
            log.debug('value', resultadoBusca.value)
            log.debug('parsed', resultadoBusca.parsed)
            log.debug('valor', resultadoBusca.valor)
        }

        function modificaRegistro(valor){
            var registro = record.load({
                type: 'journalentry',
                id: valor,
                isDynamic: true
            })
            var data = new Date()
            log.debug('data', data)
            registro.setValue('reversaldate', data)
            registro.save()
        }
    }

    return {
        getInputData: getInputData,
        map: map
    }
});
