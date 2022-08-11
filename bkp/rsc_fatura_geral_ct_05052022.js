/**
 *@NApiVersion 2.1
*@NScriptType ClientScript
*/

const custPage = 'custpage_rsc_';
const hoje = new Date();

define(['N/https', 'N/log', 'N/currentRecord', 'N/record', 'N/runtime', 'N/search', 'N/ui/dialog', 'N/url'], (https, log, currentRecord, record, runtime, search, dialog, url) => {
const conferirContrato = (idContrato) => {
    const loadReg = record.load({type: 'invoice', id: idContrato});

    var contratosIrregulares = []

    for (i=0; i<loadReg.getLineCount(custPage+'parcelas'); i++) {
        var indice = loadReg.getSublistValue(custPage+'parcelas', custPage+'indice', i);
        var parcela = loadReg.getSublistValue(custPage+'parcelas', custPage+'ver', i);

        if (!indice) {
            contratosIrregulares.push(parcela);
        }
    }

    return contratosIrregulares.length;
}

const validarDataVencimento = (vencimento) => {
    const partesData = vencimento.split("/");

    const dataVencParcela = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    const hoje = new Date();

    var diaVencParcela = dataVencParcela.getDate();
    var mesVencParcela = dataVencParcela.getMonth()+1;
    var anoVencParcela = dataVencParcela.getFullYear();

    var diaHoje = hoje.getDate();
    var mesHoje = hoje.getMonth()+1;
    var anoHoje = hoje.getFullYear();

    if (anoVencParcela < anoHoje) {
        return false;
    }

    if (mesVencParcela < mesHoje) {
        if (anoVencParcela <= anoHoje) {
            return false;
        }   
    } 

    if (diaVencParcela < diaHoje) {
        if (anoVencParcela <= anoHoje && mesVencParcela <= mesHoje) {
            return false;
        } 
    }

    return true;
}

const pageInit = (context) => {}

const saveRecord = (context) => {}

const validateField = (context) => {}

const fieldChanged = (context) => {}

const postSourcing = (context) => {}

const lineInit = (context) => {}

const validateDelete = (context) => {}

const validateInsert = (context) => {}

const validateLine = (context) => {}

const sublistChanged = (context) => {}

const clientForSuitelet = () => {
    const registroAtual = currentRecord.get();

    // var contratosIrregulares = conferirContrato(registroAtual.id);

    // if (contratosIrregulares > 0) {
    //     dialog.alert({
    //         title: 'Aviso!',
    //         message: 'Existem '+contratosIrregulares+' parcela(s) sem índice. <br> Favor regularizar contrato.'
    //     });
    
    //     return false;   
    // }

    var urlReparcelamentoSuitelet = url.resolveScript({
        scriptId: 'customscript_rsc_fatura_reparcela_st',
        deploymentId: 'customdeploy_rsc_fatura_reparcela_st'
    }) 
    + '&recordid=' + registroAtual.id;

    document.location = urlReparcelamentoSuitelet;
}

const distrato = () => {
    const registroAtual = currentRecord.get();

    const loadReg = record.load({type: 'salesorder', id: registroAtual.id});

    var indice = loadReg.getValue('custbody_rsc_indice');
    var unidade = loadReg.getValue('custbody_rsc_tran_unidade');
     
    if(unidade){
        var simulacao = true;
        var idDistrato;
        var searchDistrato = search.create({
            type: "customrecord_rsc_escritura_distrato",
            filters:[
                ["custrecord_rsc_contrato_distrato", "IS", registroAtual.id]
            ]
        }).run().each(function (result) {
            console.log(result.id)
            var lookupDistrato = search.lookupFields({
                type:'customrecord_rsc_escritura_distrato',
                id: result.id,
                columns:[
                    'custrecord_rsc_status_distrato'
                ]
            })
            if(lookupDistrato.custrecord_rsc_status_distrato[0].value != 4){
                console.log("entrou no if?")
                simulacao = false
                idDistrato = result.id
            }
            return true
        })
        if(simulacao){
            var urlReparcelamentoSuitelet = url.resolveScript({
                scriptId: 'customscript_rsc_simulacao_distrato',
                deploymentId: 'customdeploy_rsc_simulacao_distrato',
                params: {
                    recordid: registroAtual.id
                }
            })    
            window.open(urlReparcelamentoSuitelet);
        }else{
            var urlDistrato = url.resolveRecord({
                recordId: idDistrato,
                recordType: 'customrecord_rsc_escritura_distrato'
            }) 
            window.open(urlDistrato, "_blank");
        }
    }else{
        dialog.alert({
            title:'Aviso!',
            message:'Preencha o campo unidade para prosseguir'
        })
    }   
}

const cessaoDireito = () => {
    const registroAtual = currentRecord.get();

    const loadReg = record.load({type: 'salesorder', id: registroAtual.id});

    const fluxoPagamentos = loadReg.getLineCount(custPage+'parcelas');

    for (i=0; i<fluxoPagamentos; i++) {
        var vencimento = loadReg.getSublistText(custPage+'parcelas', custPage+'vencimento', i);
        var dataPagto = loadReg.getSublistText(custPage+'parcelas', custPage+'data_pagamento', i);

        if (validarDataVencimento(vencimento) == false && !dataPagto) {
            dialog.alert({
                title: 'Aviso!',
                message: 'Esta fatura possui parcelas em atraso.'
            });
    
            return false;
        }
    }

    const proponentes = loadReg.getLineCount('custpage_rsc_proponentes');
    
    var arrayProponentes = [];

    for (i=0; i<proponentes; i++) {
        arrayProponentes.push({
            id: loadReg.getSublistText('custpage_rsc_proponentes', custPage+'id_prop', i),
            custrecord_rsc_clientes_contratos: {
                value: loadReg.getSublistValue('custpage_rsc_proponentes', custPage+'clientes', i),
                text: loadReg.getSublistText('custpage_rsc_proponentes', custPage+'clientes', i)
            },
            custrecord_rsc_pct_part: loadReg.getSublistValue('custpage_rsc_proponentes', custPage+'perc_participacao', i),
            custrecord_rsc_principal: loadReg.getSublistValue('custpage_rsc_proponentes', custPage+'principal', i)
        });
    }

    const bscFI_Open = (id) => {
        var srcFI_Open = search.create({type: "transaction",
            filters: [  
                ["shipping","is","F"], "AND", 
                ["taxline","is","F"], "AND", 
                ["mainline","is","T"], "AND", 
                ["custbody_lrc_fatura_principal","anyof",id], "AND", 
                ["status","anyof","CustInvc:D","CustInvc:A"]
            ],
            columns: [
                "internalid","tranid","statusref"
            ]
        });
        console.log('srcFI_Open', srcFI_Open.runPaged().count);

        return srcFI_Open.runPaged().count;
    }

    if (bscFI_Open(registroAtual.id) == 0) { // Parcelas em aberto
        dialog.alert({
            title: 'Aviso!',
            message: 'Esta fatura não possui parcelas em aberto.'
        });

        return false;
    }
    
    const lookupJob = search.lookupFields({type: 'job',
        id: loadReg.getValue('custbody_rsc_projeto_obra_gasto_compra'),
        columns: ['custentity_rsc_perc_cessao_direito', 'custentity_rsc_juros', 'custentity_rsc_multa']
    });

    var urlCessaoDireito = url.resolveScript({ // RSC Fatura Cessão Direito ST
        scriptId: 'customscript_rsc_fatura_cessao_direito',
        deploymentId: 'customdeploy_rsc_fatura_cessao_direito'
    }) + 
    '&recordid=' + registroAtual.id + 
    '&job=' + loadReg.getValue('custbody_rsc_projeto_obra_gasto_compra') + 
    '&entity=' + loadReg.getValue('entity') + 
    '&perc_cessao_direito=' + lookupJob.custentity_rsc_perc_cessao_direito +
    '&juros=' + lookupJob.custentity_rsc_juros +
    '&multa=' + lookupJob.custentity_rsc_multa +
    '&proponentes=' + JSON.stringify(arrayProponentes);    

    window.open(urlCessaoDireito);
}

const atualizarContrato = () => {
    const registroAtual = currentRecord.get();

    var dia = hoje.getDate() > 9 ? hoje.getDate() : '0'+hoje.getDate();
    var mes = hoje.getMonth() > 9 ? hoje.getMonth() : '0'+(hoje.getMonth()+1); 
    var ano = hoje.getFullYear();
    var str = ' || Approved...';

    var memo = dia+'/'+mes+'/'+ano+str;

    var lookupPedido = search.lookupFields({type: 'salesorder',
        id: registroAtual.id,
        columns: ['location','custbody_rsc_nr_proposta']
    });
    
    var locationProposta = (lookupPedido.location[0].text.substr(1,4) + lookupPedido.custbody_rsc_nr_proposta).replace(/\s/g, '');

    try {
        var loadReg = record.load({type: 'salesorder', id: registroAtual.id, isDynamic: true});

        loadReg.setValue('memo', memo)
        .setValue('custbody_rsc_tipo_transacao_workflow', 24) // PV - Contrato
        .setValue('custbody_rsc_status_contrato', 2) // Contrato
        .setValue('custbody_lrc_numero_contrato', locationProposta) // Localidade + Número Proposta
        .setValue('custbody_lrc_tipo_contrato', 'PCV');

        for (i=0; i<loadReg.getLineCount('item'); i++) {
            loadReg.selectLine('item', i)
            .setCurrentSublistValue('item', 'isclosed', true)
            .commitLine('item');
        }
    
        loadReg.save({ignoreMandatoryFields : true});

        var urlExterna = url.resolveScript({
            scriptId: 'customscript_rsc_gaf_rec_atu_contrato_ar',
            deploymentId: 'customdeploy_rsc_gaf_rec_atu_contrato_ar',
            returnExternalUrl: true
        });
        console.log(urlExterna, urlExterna);

        var url_atualizar_contrato = https.post({ // GAF Rec Atualizar Contrato AR
            url: urlExterna,
            body: {
                id: registroAtual.id            
            }
        });        
        console.log(url_atualizar_contrato, JSON.stringify(url_atualizar_contrato));
        
        // Atualiza a página
        document.location.reload(true);
    } catch(e) {
        console.log('Erro atualizarContrato', e);

        if (e.name != 'SSS_REQUEST_TIME_EXCEEDED') {
            dialog.alert({
                title: 'Aviso!',
                message: 'Houve um erro no processamento da solicitação.'
            });
    
            return false;
        } else {
            // Atualiza a página
            document.location.reload(true);
        }       
    }   
}

return {
    atualizarContrato: atualizarContrato,
    cessaoDireito: cessaoDireito,
    distrato: distrato,
    clientForSuitelet: clientForSuitelet,
    pageInit: pageInit,    
    // saveRecord: saveRecord,
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
