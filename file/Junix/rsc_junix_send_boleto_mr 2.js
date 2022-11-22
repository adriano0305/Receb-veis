/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
 define(['N/search', 'N/runtime', 'N/record', './rsc_junix_call_api.js'],
    
 (search, runtime, record, api) => {
    var getInputData = function () {
        return search.create({
            type: 'creditmemo',
            filters: [
                // ['custbody_rsc_pago', 'IS', '1'],
                // 'AND',
                ['custbody_rsc_boleto_criado', 'IS', 'F'],
                'AND',
                ['mainline', 'IS', 'T'],
                'AND',
                ['internalid', 'IS', 220788]            
            ],
        });
    };
    var map = function (ctx) {
        var req = JSON.parse(ctx.value);
        log.debug('req',req);
        var lookupMemCred = search.lookupFields({
            type:'creditmemo',
            id:req.id,
            columns:['custbody_lrc_numero_contrato', 'trandate', 'total', 'custbody_rsc_cnab_inst_bank_ls', 'entity', 'subsidiary', 'custbody_rsc_projeto_obra_gasto_compra']
        })
        log.debug("lookupMemCred", lookupMemCred);
        var nBoleto = ""
        if(lookupMemCred.custbody_lrc_numero_contrato){
            nBoleto = lookupMemCred.custbody_lrc_numero_contrato;
        }
        var date = lookupMemCred.trandate;
        var total = lookupMemCred.total;
        var banco = "";
        var codBanco = "";
        if(lookupMemCred.custbody_rsc_cnab_inst_bank_ls.length > 0){
            banco = lookupMemCred.custbody_rsc_cnab_inst_bank_ls[0].value
            var bancoLookup = search.lookupFields({
                type: 'customrecord_rsc_cnab_bank',
                id: banco,
                columns: ['custrecord_rsc_cnab_bank_code_ds']
            })
            log.debug("bancoLookup", bancoLookup);

            if(bancoLookup.custrecord_rsc_cnab_bank_code_ds){
                codBanco = bancoLookup.custrecord_rsc_cnab_bank_code_ds
            }
        }
        var clienteLookup = search.lookupFields({
            type: 'customer',
            id: lookupMemCred.entity[0].value,
            columns:['custentity_enl_cnpjcpf', 'companyname', 'salutation', 'shipaddressee']
        })
        log.debug("clienteLookup", clienteLookup);

        var nome = "";
        if (clienteLookup.companyname) {
            nome = String(clienteLookup.companyname);
        }
        else if (clienteLookup.salutation) {
            nome = String(clienteLookup.salutation);
        }
        else {
            nome = String(clienteLookup.shipaddressee);
        }
        log.debug("nome", nome);
        var contaSearch = search.create({
            type: 'customrecord_rsc_cnab_bankaccount',
            filters: [
                ['custrecord_rsc_cnab_ba_entity_ls', 'IS', lookupMemCred.custbody_rsc_projeto_obra_gasto_compra[0].value]
            ]
        }).run().getRange({
            start: 0,
            end: 1
        })
        log.debug("contaSearch", contaSearch);

        var recordConta = record.load({
            type: 'customrecord_rsc_cnab_bankaccount',
            id: contaSearch[0].id
        })
        var searchSub = search.lookupFields({
            type: 'subsidiary',
            id: lookupMemCred.subsidiary[0].value,
            columns:[
                'taxidnum'
            ]
        })
        log.debug("searchSub", searchSub);
        log.debug("portfolio", recordConta.getValue('custrecord_rsc_cnab_ba_portfolio_ls'))

        var portLookup = record.load({
            type: 'customrecord_rsc_cnab_portfolio',
            id: recordConta.getValue('custrecord_rsc_cnab_ba_portfolio_ls'),
        })
        // portLookup.getValue('custrecord_rsc_nosso_numero');
        log.debug("portfolio", recordConta.getValue('custrecord_rsc_cnab_ba_portfolio_ls'))
        var obj = {
            "numeroDocumento": nBoleto,
            "codigoBanco": codBanco,
            "dataVencimento": date,
            "dataBaixa": date,
            "nossoDocumento": portLookup.getValue('custrecord_rsc_numero_doc'),
            "nossoNumero": portLookup.getValue('custrecord_rsc_nosso_numero'),
            "Valor": (total * -1),
            "cedenteCodigo": lookupMemCred.entity[0].value,
            "cedenteCPFCNPJ": clienteLookup.custentity_enl_cnpjcpf,
            "cedenteNome": nome,
            "cedenteAgencia": recordConta.getValue("custrecord_rsc_cnab_ba_agencynumber_ls"),
            "cedenteConta": recordConta.getValue("custrecord_rsc_cnab_ba_number_ds"),
            "cedenteContaDigito": recordConta.getValue("custrecord_rsc_cnab_ba_dvnumber_ds"),
            "sacadoCPFCNPJ": searchSub.taxidnum,
            "codigoCarteira": portLookup.getValue("custrecord_rsc_cnab_portfolio_code_ds"),
            "linhaDigitavel": ""
        }
        // var body = {
        //     "dados": obj,
        //     "ok": true,
        //     "mensagem": "Baixa Realizada"
        // }
        log.debug( 'obj', obj);
        var retorno = JSON.parse(api.sendRequest(body, 'INCLUIRDOCUMENTO_JUNIX/1.0/'));
        log.debug({title: 'Resultado', details: retorno});
        if(retorno.OK){
            var creditMemoRecord = record.load({
                type:'creditmemo',
                id: req.id
            })
            creditMemoRecord.setValue({
                fieldId:'custbody_rsc_boleto_criado',
                value: true
            })
            creditMemoRecord.save({
                ignoreMandatoryFields: true
            })
            portLookup.setValue({
                fieldId: 'custrecord_rsc_nosso_numero',
                value: Number(portLookup.getValue("custrecord_rsc_nosso_numero")) + 1
            })
            portLookup.save({
                ignoreMandatoryFields: true
            })
        }
    };
    const summarize = (summaryContext) => {

    }
    return {getInputData, map, summarize}
});
