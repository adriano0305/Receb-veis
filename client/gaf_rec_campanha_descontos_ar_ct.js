/**
 *@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/log', 'N/query', 'N/search', 'N/ui/dialog'], function(log, query, search, dialog) {
// function discountCampaign(vi, vf, jobs) {
//     log.audit('discountCampaign', {vi: vi, vf: vf, jobs: jobs});

//     var bscDC = search.create({type: "customrecord_rsc_campanhadesconto",
//         filters: [
//            ["custrecord_rsc_vigenciainicio","on",vi], "AND", 
//            ["custrecord_rsc_vigenciafim","on",vf], "AND", 
//            ["custrecord_rsc_empreendimentocampanha","anyof",jobs]
//         ],
//         columns: [
//             "name","custrecord_rsc_vigenciainicio","custrecord_rsc_vigenciafim","custrecord_rsc_percentualdesconto","custrecord_rsc_meta","custrecord_rsc_observacaocampanha","custrecord_rsc_empreendimentocampanha"
//         ]
//     }).run().getRange(0,1);
//     log.audit('bscDC', bscDC);

//     return bscDC;
// }

function discountCampaign(vi, vf, jobs) {
    log.audit('discountCampaign', {vi: vi, vf: vf, jobs: jobs});

    var myDiscountCampaignQuery = query.create({type: 'customrecord_rsc_campanhadesconto'});

    var condicao1 = myDiscountCampaignQuery.createCondition({
        fieldId: 'custrecord_rsc_vigenciainicio',
        operator: query.Operator.ON,
        values: vi
    });

    var condicao2 = myDiscountCampaignQuery.createCondition({
        fieldId: 'custrecord_rsc_vigenciafim',
        operator: query.Operator.ON,
        values: vf
    });

    var condicao3 = myDiscountCampaignQuery.createCondition({
        fieldId: 'custrecord_rsc_empreendimentocampanha',
        operator: query.Operator.INCLUDE_ALL,
        values: jobs
    });

    myDiscountCampaignQuery.condition = myDiscountCampaignQuery.and(
        condicao1, condicao2, condicao3
    );

    myDiscountCampaignQuery.columns = [
        myDiscountCampaignQuery.createColumn({
            fieldId: 'id'
        }),
        myDiscountCampaignQuery.createColumn({
            fieldId: 'name'
        }),
        myDiscountCampaignQuery.createColumn({
            fieldId: 'custrecord_rsc_vigenciainicio'
        }),
        myDiscountCampaignQuery.createColumn({
            fieldId: 'custrecord_rsc_vigenciafim'
        }),
        myDiscountCampaignQuery.createColumn({
            fieldId: 'custrecord_rsc_percentualdesconto'
        }),
        myDiscountCampaignQuery.createColumn({
            fieldId: 'custrecord_rsc_meta'
        }),
        myDiscountCampaignQuery.createColumn({
            fieldId: 'custrecord_rsc_observacaocampanha'
        }),
        myDiscountCampaignQuery.createColumn({
            fieldId: 'custrecord_rsc_empreendimentocampanha'
        })
    ];

    var resultSet = myDiscountCampaignQuery.run();
    log.audit('resultSet', resultSet);

    var results = resultSet.results;
    log.audit('results', results);

    return results;
}

function pageInit(context) {}

function saveRecord(context) {
    log.audit('saveRecord', context);

    const registroAtual = context.currentRecord;

    var vigenciaInicio = registroAtual.getValue('custrecord_rsc_vigenciainicio');
    var vigenciaFim = registroAtual.getValue('custrecord_rsc_vigenciafim');

    var empreendimentos = registroAtual.getValue('custrecord_rsc_empreendimentocampanha');

    var bscCD = discountCampaign(vigenciaInicio, vigenciaFim, empreendimentos);
    log.audit('bscCD', bscCD);

    if (bscCD.length > 0) {
        dialog.alert({
            title: 'Aviso!',
            message: 'Campanha já cadastrada! <br>'+
            'ID: ' + bscCD[0].values[0] + '<br>' +
            'Nome: ' + bscCD[0].values[1]
        });

        return false;
    }

    return true;
}

function validateField(context) {}

function fieldChanged(context) {}

function postSourcing(context) {}

function lineInit(context) {}

function validateDelete(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function sublistChanged(context) {}

/** gaf_rec_campanha_descontos_ar_ct.js 
 * GAF REC Campanha Descontos AR CT
 * _gaf_rec_campanha_desc_ar_ct
 * GAFISA_Recebiveis_CampanhaDescontos_AdrianoReis_ClientScript
*/

// require(['N/query'], function(query) {
//     var myDiscountCampaignQuery = query.create({type: 'customrecord_rsc_campanhadesconto'});

//     var condicao1 = myDiscountCampaignQuery.createCondition({
//         fieldId: 'custrecord_rsc_vigenciainicio',
//         operator: query.Operator.ON,
//         values: '01/08/2022'
//     });

//     var condicao2 = myDiscountCampaignQuery.createCondition({
//         fieldId: 'custrecord_rsc_vigenciafim',
//         operator: query.Operator.ON,
//         values: '30/09/2022'
//     });

//     var condicao3 = myDiscountCampaignQuery.createCondition({
//         fieldId: 'custrecord_rsc_empreendimentocampanha',
//         operator: query.Operator.INCLUDE_ALL,
//         values: ['21876','21920']
//     });

//     myDiscountCampaignQuery.condition = myDiscountCampaignQuery.and(
//         condicao1, condicao2, condicao3
//     );

//     myDiscountCampaignQuery.columns = [
//         myDiscountCampaignQuery.createColumn({
//             fieldId: 'id'
//         }),
//         myDiscountCampaignQuery.createColumn({
//             fieldId: 'name'
//         }),
//         myDiscountCampaignQuery.createColumn({
//             fieldId: 'custrecord_rsc_vigenciainicio'
//         }),
//         myDiscountCampaignQuery.createColumn({
//             fieldId: 'custrecord_rsc_vigenciafim'
//         }),
//         myDiscountCampaignQuery.createColumn({
//             fieldId: 'custrecord_rsc_percentualdesconto'
//         }),
//         myDiscountCampaignQuery.createColumn({
//             fieldId: 'custrecord_rsc_meta'
//         }),
//         myDiscountCampaignQuery.createColumn({
//             fieldId: 'custrecord_rsc_observacaocampanha'
//         }),
//         myDiscountCampaignQuery.createColumn({
//             fieldId: 'custrecord_rsc_empreendimentocampanha'
//         })
//     ];

//     var resultSet = myDiscountCampaignQuery.run();
//     console.log(JSON.stringify(resultSet));

//     var results = resultSet.results;
//     console.log(JSON.stringify(results));
// });

return {
    // pageInit: pageInit,
    saveRecord: saveRecord,
    // validateField: validateField,
    // fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    // sublistChanged: sublistChanged
}
});
