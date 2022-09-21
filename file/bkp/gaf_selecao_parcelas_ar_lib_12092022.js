/**
 * @NApiVersion 2.x
 * @NModuleScope public
 * @author Adriano Barbosa
 * @since 2021.3
 */
define(['N/log', 'N/query'], function(log, query) {
function lkpFI(id) {
    var sql = "SELECT custbody_rsc_ultima_atualizacao "+
    "FROM transaction "+
    "WHERE recordtype = 'invoice' "+
    "AND id = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [id]
    });

    var sqlResults = consulta.asMappedResults();
    // console.log('sqlResults lkpFI', JSON.stringify(sqlResults));
    log.audit('sqlResults lkpFI', sqlResults);

    return sqlResults;
} 

function fatorCorrecao(status, indice, dataInicio, dataFim) {
    log.audit('fatorCorrecao', {status: status, indice: indice, dataInicio: dataInicio, dataFim: dataFim});
    
    var sql = "SELECT uc.id, uc.name, fh.custrecord_rsc_hif_factor_percent, fh.custrecord_rsc_hif_effective_date "+
    "FROM customrecord_rsc_correction_unit AS uc "+
    "JOIN customrecord_rsc_factor_history AS fh ON (uc.id = fh.custrecord_rsc_hif_correction_unit) "+
    "WHERE UC.id = ? "+
    "AND fh.custrecord_rsc_hif_effective_date BETWEEN ? AND ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [indice, dataInicio, dataFim]
    });

    var sqlResults = consulta.asMappedResults();
    // console.log('sqlResults fatorCorrecao', JSON.stringify(sqlResults));
    log.audit('sqlResults fatorCorrecao', sqlResults);

    if (sqlResults[0]) {
        return {
            id: sqlResults[0].id,
            name: sqlResults[0].name,
            custrecord_rsc_hif_factor_percent: sqlResults[0].custrecord_rsc_hif_factor_percent,
            custrecord_rsc_hif_effective_date: sqlResults[0].custrecord_rsc_hif_effective_date,
            status: status
        }
    }

    return sqlResults;
}

function job(empreendimento) {
    var sql = "SELECT id, entityid, custentity_rsc_juros, custentity_rsc_multa "+
    "FROM job "+
    "WHERE id = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [empreendimento]
    });

    var sqlResults = consulta.asMappedResults();
    // console.log('sqlResults job', JSON.stringify(sqlResults));
    log.audit('sqlResults job', sqlResults);

    return sqlResults;
}

function juros_e_acrescimos_moratorios(id, item) {
    var sql = "SELECT foreignamount FROM transactionline "+
    "WHERE transactionline.transaction = ? "+
    "AND transactionline.item = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [id, item]
    });

    var sqlResults = consulta.asMappedResults();

    var acrescimosMoratorios;
    if (sqlResults.length != 0) {
        acrescimosMoratorios = sqlResults[0].foreignamount;
    } else {
        acrescimosMoratorios = 0;
    }    
    
    // console.log('sqlResults juros_e_acrescimos_moratorios', acrescimosMoratorios);
    log.audit('sqlResults juros_e_acrescimos_moratorios', sqlResults);
    
    return acrescimosMoratorios;
}

return {
    juros_e_acrescimos_moratorios: juros_e_acrescimos_moratorios,
    job: job,
    fatorCorrecao: fatorCorrecao,
    lkpFI: lkpFI
}

});