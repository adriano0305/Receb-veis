/**
 * @NApiVersion 2.1
 */
define(['N/file', 'N/query'],
    
    (file, query) => {
            var joinsAll = [];
            var headersAll = [];
            var dividendoAll = [];
            var divisorAll = [];

            function _loadAllValues(){
                    joinsAll = query.runSuiteQL({query: 'select dataset.id, dataset.custrecord_rsc_table, ' +
                                'apropjoin.custrecord_rsc_aprop_origem, apropjoin.custrecord_rsc_aprop_operacao, ' +
                                'apropjoin.custrecord_rsc_aprop_destino , * from customrecord_rsc_aprop_join apropjoin ' +
                                'join customrecord_rsc_aprop_data_set dataset on dataset.id = apropjoin.custrecord_rsc_aprop_data_set\n' +
                                '                    where dataset.isinactive = \'F\''}).asMappedResults();

                    headersAll = query.runSuiteQL({
                            query: 'select custrecord_rsc_fatores_operacao, id from customrecord_rsc_param_fatores where isinactive = \'F\''
                    }).asMappedResults();
                    log.audit('headersAll', headersAll);

                    dividendoAll = query.runSuiteQL({query: 'select ' +
                                '   custrecord_rsc_sublist_cp_info amount, ' +
                                '   custrecord_rsc_sublist_originfo origin, ' +
                                '   custrecord_rsc_sublist_cp_filtro filter, ' +
                                '   custrecord_rsc_sublist_vl_filtro resultFilters, ' +
                                '       custrecord_rsc_vinc_param id ' +
                                ' from customrecord_rsc_rec_dividendo where isinactive = \'F\''}).asMappedResults();

                    divisorAll = query.runSuiteQL(
                        {query: 'select ' +
                                    '   custrecord_rsc_sublist2_cp_info amount, ' +
                                    '   custrecord_rsc_sublist2_originfo origin, ' +
                                    '   custrecord_rsc_sublist2_cp_filtro filter, ' +
                                    '   custrecord_rsc_sublist2_vl_filtro resultFilters,' +
                                    '   custrecord_rsc_vinc_param2 id, ' +
                                    '   custrecord_rsc_aprop_base_custo id2, ' +
                                    '   custrecord_rsc_sublist2_operacao tipoop ' +
                                    ' from customrecord_rsc_rec_divisor where isinactive = \'F\''}).asMappedResults();
            }

            function _getJoin(alias, period){
                    var period = period;
                    var joins = joinsAll.filter(word => word.id === alias);
                    if (joins.length > 0 ){
                            var stringJoin = 'from ';
                            stringJoin += joins[0]['custrecord_rsc_table'];
                            stringJoin += ' where ';
                            for (var i = 0; i < joins.length; i++ ){
                                    if (i > 0 ){
                                            stringJoin += ' AND ';
                                    }
                                    var join = joins[i];
                                    //log.debug({title:'Join valores', details: join});
                                    stringJoin += ' ' + join['custrecord_rsc_aprop_origem'] ;
                                    switch (join['custrecord_rsc_aprop_operacao']){
                                            case 1 : stringJoin += ' = ';
                                                    break;
                                            case 2 : stringJoin += ' != ';
                                                    break;
                                            case 3 : stringJoin += ' > ';
                                                    break;
                                            case 4 : stringJoin += ' <>> ';
                                                    break;
                                            case 5 : stringJoin += ' <= ';
                                                    break;
                                            case 6 : stringJoin += ' >= ';
                                                    break;
                                    }
                                    switch (join['custrecord_rsc_aprop_destino']){
                                            case '#period':
                                                    stringJoin += ' ' + period;
                                                    break;
                                            default:
                                                    stringJoin += ' ' + join['custrecord_rsc_aprop_destino'];
                                    }

                            }
                            //log.audit({title: 'Join ', details: stringJoin});
                            return stringJoin;
                    }

                    return null;

            }

            function getFatorIndividual(idFator, period){
                log.audit('getFatorIndividual', {idFator: idFator, period: period});

                    var headers = headersAll.filter(word => word.id === idFator);
                //     log.audit('getFatorIndividual', {headers: headers});
                    if (headers.length > 0 )
                            for (let i = 0; i < headers.length; i++) {
                                    var header = headers[i];
                                    /* Preparar SQL dos Fatores. */
                                    var dividendo = dividendoAll.filter(word => word.id === header['id']);
                                //     log.audit('getFatorIndividual', {dividendo: dividendo});
                                    var sqlValores = '';
                                    if (dividendo.length > 0){
                                            var sqlDividendo = '(';
                                            for (let j = 0; j < dividendo.length; j++ ){
                                                    if (j > 0 ){
                                                            sqlDividendo += ' + (';
                                                    }
                                                    var div = dividendo[j];
                                                    sqlDividendo += 'select sum(';
                                                    sqlDividendo += div['amount'];
                                                    sqlDividendo += ') valor ' + _getJoin(div['origin'], period);
                                                    if (div['filter'] != null){
                                                            sqlDividendo += ' and ' + div['filter'];
                                                            sqlDividendo += ' in (' + div['resultfilters'] + ') ';
                                                    }
                                                    if (dividendo.length >1){
                                                            sqlDividendo += ')';
                                                    }

                                            }
                                            if (dividendo.length == 1){
                                                    sqlDividendo += ')';
                                            }
                                    }

                                    var divisor = divisorAll.filter(word => word.id === header['id']);
                                //     log.audit('getFatorIndividual', {divisor: divisor});
                                    if (divisor.length > 0){
                                            var sqlDivisor = '(';
                                            for (let j = 0; j < divisor.length; j++ ){
                                                    if (j > 0 ){
                                                            sqlDivisor += ' + (';
                                                    }

                                                    var div = divisor[j];
                                                    sqlDivisor += 'select sum(';
                                                    sqlDivisor += div['amount'];
                                                    sqlDivisor += ') valor ' + _getJoin(div['origin'], period);
                                                    if (div['filter'] != null){
                                                            sqlDivisor += ' and ' + div['filter'];
                                                            sqlDivisor += ' in (' + div['resultfilters'] + ') ';
                                                    }

                                                    if (divisor.length > 1){
                                                            sqlDivisor += ')';
                                                    }
                                            }
                                            if (divisor.length == 1){
                                                    sqlDivisor += ')';
                                            }
                                    }

                                    sqlValores = 'round(((((abs(' + sqlDividendo + ')) / (abs(' + sqlDivisor + '))))), 5)';
                                //     log.debug({title: 'Sql fatores Totais ', details : sqlValores});
                            }
                    log.debug({title: 'Sql Apropriação ', details: sqlValores});
                    return sqlValores
            }

            function getComponentes(id, period){
                log.audit('getComponentes', {id: id, period: period});

                    var sql = 'select a.id, a.custrecord_rsc_aprop_componente componente, custrecord_rsc_aprop_partida partida, ' +
                        'custrecord_rsc_aprop_contrapartida contrapartida, custrecord_rsc_aprop_perc_fator percfator, ' +
                        'custrecord_rsc_aprop_fator fator, custrecord_rsc_aprop_oper_invert operacaoinvertida, ' +
                        'custrecord_rsc_aprop_lancar_diferenca nlancadif, custrecord_rsc_aprop_lancar_maior_zero lancar_maior_zero,' +
                        ' custrecord_rsc_aprop_conta_credora contacredora , custrecord_rsc_aprop_rateio rateio' +
                        ' from customrecord_rsc_aprop_parametros a ' +
                        'join customlist_rsc_aprop_tipo_aprop b on a.custrecord_rsc_aprop_tipo_apropriacao  = b.id ' +
                        'where a.isinactive = \'F\' and b.scriptid = \'' + id + '\' order by a.custrecord_rsc_aprop_sequencia';
                    var queryResults = query.runSuiteQL({query: sql}).asMappedResults();
                    log.audit('getComponentes queryResults', queryResults);
                    
                    var sqlRetorno = '';
                    if ( queryResults.length > 0){
                            for (var i = 0; i < queryResults.length; i++ ){
                                    var queryResult = queryResults[i];
                                    var percentual = 0;
                                    if (queryResult['percfator'] != null && queryResult['percfator'] > 0){
                                            percentual = queryResult['percfator'];
                                        //     log.audit('percentual !null && > 0', percentual);
                                    } else {
                                            var fatorConsiderado = queryResult['fator'];
                                            /* Recuperar o percentual do fator. */
                                            percentual = getFatorIndividual(queryResult['fator'], period);
                                        //     log.audit('percentual getFatorIndividual()', percentual);
                                    }
                                    var sqlRet = '( ';
                                    /* Get Divisor  by fator */
                                    var divisor = divisorAll.filter(word => word.id2 === queryResult['id']);
                                    if (divisor.length > 0){
                                            var sqlDivisor = '(';
                                            for (let j = 0; j < divisor.length; j++ ){
                                                    if (j > 0 ){
                                                            sqlDivisor += ' + (';
                                                    }

                                                    var div = divisor[j];
                                                    sqlDivisor += 'select sum(';

                                                    sqlDivisor += div['amount'];
                                                    sqlDivisor += ') ';
                                                    if (div['tipoop'] == '-'){
                                                       sqlDivisor += ' *-1 '
                                                    }
                                                    sqlDivisor += ' valor ' + _getJoin(div['origin'],period);
                                                    if (div['filter'] != null){
                                                            sqlDivisor += ' and ' + div['filter'];
                                                            sqlDivisor += ' in (' + div['resultfilters'] + ') ';
                                                    }

                                                    if (divisor.length > 1){
                                                            sqlDivisor += ')';
                                                    }
                                            }
                                            if (divisor.length == 1){
                                                    sqlDivisor += ')';
                                            }
                                    }
                                    sqlRet = 'round(((( ' + sqlDivisor + ') * '+ percentual + ')), 2)' + queryResult['componente']
                                        +'_' + queryResult['partida'] +'_' + queryResult['contrapartida'] +'_' + queryResult['id']
                                        +'_' + queryResult['operacaoinvertida'] + '_' + queryResult['nlancadif'] +
                                        '_' + queryResult['lancar_maior_zero'] + '_' + queryResult['contacredora'] +
                                        '_' + queryResult['rateio'] + ' , ';
                                    sqlRetorno += sqlRet;
                                //     log.audit('getComponentes', {sqlRetorno: sqlRetorno});
                            }
                    }
                    log.audit('getComponentes', {sqlRetorno: sqlRetorno});
                    return sqlRetorno;
            }

            function getCalculo(idOperacao, period){
                log.audit('getCalculo', {idOperacao: idOperacao, period: period});
                    _loadAllValues();
                    var sql = 'select substr(subsidiary.name,1,4) subsidiary, job.id, custentity_rsc_term_cl_suspensiva inicioApropriacao, ' +
                        ' ' + getComponentes(idOperacao, period) + ' from subsidiary, job\n' +
                        // 'where 1 = subsidiary.custrecordtpemp and job.custentity_rsc_aprop_subsidiaria = subsidiary.id order by 1';
                        'where 1 = subsidiary.custrecordtpemp and job.custentity_rsc_aprop_subsidiaria = subsidiary.id and job.id in (21906,21910,21922,21952) order by 1'

                         // 74 PARQUE ECOVILLE F4 - BARIGUI
                        // 'where 1 = subsidiary.custrecordtpemp and job.custentity_rsc_aprop_subsidiaria = subsidiary.id and job.id in (21922) order by 1';
                        
                        // 76 PARQUE ECOVILLE F3 - PASSAUNA
                        // 'where 1 = subsidiary.custrecordtpemp and job.custentity_rsc_aprop_subsidiaria = subsidiary.id and job.id in (21925) order by 1';                       

                        // 290 PARQUE ECOVILLE FASE 2 - (ED. IGUAÇU) 
                        // 'where 1 = subsidiary.custrecordtpemp and job.custentity_rsc_aprop_subsidiaria = subsidiary.id and job.id in (51506) order by 1'; 
                        
                        // 669 Parque Ecoville F1 (Ed. Tingui e Ed. São Lourenço)
                        // 'where 1 = subsidiary.custrecordtpemp and job.custentity_rsc_aprop_subsidiaria = subsidiary.id and job.id in (52135) order by 1';   
                        
                        // TUDO
                        // 'where 1 = subsidiary.custrecordtpemp and job.custentity_rsc_aprop_subsidiaria = subsidiary.id and job.id in (21922, 21925, 51506, 52135) order by 1';  
                    log.error({title:'getCalculo', details: sql});
                    var queryResults = query.runSuiteQL({
                            query: sql
                    });
                    var records = queryResults.asMappedResults();
                    return records
            }

        return {getCalculo}

    });
