/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['./rsc_junix_call_api.js', 'N/https', 'N/log', 'N/record'], function(api, https, log, record) {
/** Nomenclatura do arquivo:
 * gaf = iniciais de GAFISA
 * o2c = projeto em atuação
 * junix_spe = nome do script
 * ar = Adriano Reis
 * ue = userEvent
 */

function beforeSubmit(context) {
    // Define as ações que serão realizadas antes de salvar o registro na base.
    log.audit({
        title: 'beforeSubmit',
        details: context
    });

    const Record = context.newRecord;
    log.audit({
        title: 'Record',
        details: Record
    });

    // ID da Subsidiária = 158 ("0060 SERVIÇOS")
    if (Record.id == 158) {
        // Pegando os campos da subsidiária.

        var atualizadoJunix = Record.getValue({
            fieldId: 'custrecord_rsc_atualizado_spe_junix'
        });

        var status_integracao_junix = Record.getValue({
            fieldId: 'custrecord_rsc_status_sub_junix'
        });

        

        var idJunix = Record.getValue({
            fieldId: 'custrecord_rsc_id_spe_junix'
        });

        var no_registro_iva = Record.getValue({
            fieldId: 'federalidnumber'
        });

        var razaoSocial = Record.getValue({
            fieldId: 'legalname'
        });

        var nire = Record.getValue({
            fieldId: 'custrecord_rsc_sub_nire'
        });

        var endereco = Record.getSubrecord({
            fieldId: 'mainaddress'
        });

        var objEndereco = {
            zip: endereco.getValue({fieldId: 'zip'}),
            addr1: endereco.getValue({fieldId: 'addr1'}),
            addr3: endereco.getValue({fieldId: 'addr3'}),
            custrecord_enl_city: endereco.getValue({fieldId: 'custrecord_enl_city'}),
            custrecord_enl_uf: endereco.getValue({fieldId: 'custrecord_enl_uf'}),
            custrecord_enl_numero: endereco.getValue({fieldId: 'custrecord_enl_numero'}),
            addr2: endereco.getValue({fieldId: 'addr2'}),
        }
        log.audit('objEndereco', objEndereco);

        var estado_provincia = Record.getValue({
            fieldId: 'state'
        });

        var endereco_email_retorno = Record.getValue({
            fieldId: 'email'
        });       

        if (estado_provincia && endereco_email_retorno && no_registro_iva && razaoSocial) {
            log.audit({
                title: 'Campos preenchidos!', 
                details: {
                    estado_provincia: estado_provincia,
                    endereco_email_retorno: endereco_email_retorno,
                    no_registro_iva: no_registro_iva,
                    razaoSocial: razaoSocial
                }
            });

            var objSPE = {
                "codigo": idJunix,
                "cnpj": no_registro_iva,
                "razaoSocial": razaoSocial,
                "nomeFantasia": razaoSocial,
                "nire": nire,
                "cep": endereco.getValue({fieldId: 'zip'}),
                "endereco": endereco.getValue({fieldId: 'addr1'}),
                "bairro": endereco.getValue({fieldId: 'addr3'}),
                "cidade": endereco.getValue({fieldId: 'custrecord_enl_city'}),
                "estado": endereco.getValue({fieldId: 'custrecord_enl_uf'}),
                "numero": endereco.getValue({fieldId: 'custrecord_enl_numero'}),
                "complemento": endereco.getValue({fieldId: 'addr2'})
            }
            log.audit({
                title: 'objSPE', 
                details: objSPE
            });

            var getToken = api.getToken();
            log.audit('getToken', getToken);

            var getRequest = api.getRequest(objSPE);
            log.audit('getRequest', getRequest);

            // var retorno = api.sendRequest(body, 'SPE_JUNIX/1.0/');
            var retorno = api.sendRequest(objSPE);
            log.audit('retorno', retorno);

            if (retorno.OK){
                log.audit({title: retorno.OK, details: retorno.Dados});
                Record.setValue('custrecord_rsc_id_junix', retorno.Dados)
                .setValue('custrecord_rsc_atualizado_spe_junix', true)
                .setValue('custrecord_rsc_status_sub_junix', '');
            } else {
                log.debug({title: 'Erro', details: retorno});
                Record.setValue('custrecord_rsc_status_sub_junix', JSON.stringify({code: retorno.code, body: retorno.body}));
            }            
        } else {
            log.audit({
                title: 'Campos não ou parcialmente preenchidos!', 
                details: {
                    estado_provincia: estado_provincia,
                    endereco_email_retorno: endereco_email_retorno,
                    no_registro_iva: no_registro_iva,
                    razaoSocial: razaoSocial}
            });
        }
    }
}

function beforeLoad(context) {
    // Define as ações que serão realizadas ao visualizar o registro.
}

function afterSubmit(context) {
    // Define as ações que serão realizadas depois de salvar o registro na base.
}

return {
    afterSubmit: afterSubmit,
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit    
}
});
