/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Adriano Barbosa
 * @since 2021.12
 */
define(['N/log', 'N/query', 'N/runtime', 'N/search'], (log, query, runtime, search) => {
const valorPagamento = (idCP) => {
    var lookupCP = search.lookupFields({type: 'customerpayment',
        id: idCP,
        columns: ['total']
    });
    log.audit('lookupCP', lookupCP);
}

// const valorPagamento = (idCP) => {
//     var sql = "SELECT foreigntotal from TRANSACTION "+
//     "WHERE recordtype = 'customerpayment' "+
//     "AND id = ? ";

//     var consulta = query.runSuiteQL({
//         query: sql,
//         params: [idCP]
//     });

//     var sqlResults = consulta.asMappedResults();
//     log.audit('valorPagamento', sqlResults);

//     var publicScript = runtime.getCurrentScript();
//     log.audit('Unidades de governança restantes', publicScript.getRemainingUsage());

//     return sqlResults[0].foreigntotal;
// }

return {
    valorPagamento: valorPagamento
}
});
