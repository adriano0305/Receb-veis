/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
const custPage = 'custpage_rsc_';
const nomeArquivo = "rsc_fatura_cessao_direito_ct.js";

const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(['N/log', 'N/query', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'], (log, query, record, runtime, search, serverWidget) => {
function localizarProponentes(idContrato) {
    const sql = "SELECT prop.id, prop.custrecord_rsc_clientes_contratos, prop.custrecord_rsc_pct_part, prop.custrecord_rsc_principal, prop.isinactive, cust.entitytitle "+
    "FROM customrecord_rsc_finan_client_contrato as prop "+
    "INNER JOIN customer AS cust ON cust.id = prop.custrecord_rsc_clientes_contratos "+
    "WHERE prop.custrecord_rsc_fat_contrato = ? "+
    "AND prop.isinactive <> 'T' ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [idContrato]
    });

    var sqlResults = consulta.asMappedResults(); 
    log.audit('sqlResults', sqlResults);
    
    return sqlResults;
}

function listaProponentes(form, idContrato) {
    // Tabela de Proponentes
    const guiaProponentes = form.addTab({
        id: custPage+'guia_proponentes',
        label: 'Proponentes'
    });

   // Lista Proponentes
   var sublistaProp, linhaProp, prop, perc_participacao_prop, propPrincipal, inativo, arrayProponentes;

   var sublistaProp = form.addSublist({
       id: custPage+'sublista_lista_proponentes',
       type: serverWidget.SublistType.LIST,
       label: 'Proponentes',
       tab: custPage+'guia_proponentes'
   });

   linhaProp = sublistaProp.addField({
       id: custPage+'linha_prop',
       type: serverWidget.FieldType.TEXT,
       label: '#'
   });

   prop = sublistaProp.addField({
       id: custPage+'prop',
       type: serverWidget.FieldType.TEXT,
       label: 'Proponente'
   });

   perc_participacao_prop = sublistaProp.addField({
       id: custPage+'perc_participacao_prop',
       type: serverWidget.FieldType.PERCENT,
       label: 'Percentual Participação'
   });

   propPrincipal = sublistaProp.addField({
       id: custPage+'prop_principal',
       type: serverWidget.FieldType.TEXT,
       label: 'Principal'
   });

   inativo = sublistaProp.addField({
       id: custPage+'inativo',
       type: serverWidget.FieldType.TEXT,
       label: 'Inativo'
   });

   var proponentes = localizarProponentes(idContrato);

    if (proponentes.length > 0) {
        for (i=0; i<proponentes.length; i++) { 
            sublistaProp.setSublistValue({
                id: linhaProp.id,
                line: i,
                value: String(parseInt(i+1))
            });
            
            const lookupCliente = search.lookupFields({type: 'customer',
                id: proponentes[i].custrecord_rsc_clientes_contratos,
                columns: ['altname']
            });

            sublistaProp.setSublistValue({
                id: prop.id,
                line: i,
                value: proponentes[i].entitytitle,
            });

            sublistaProp.setSublistValue({
                id: perc_participacao_prop.id,
                line: i,
                value: proponentes[i].custrecord_rsc_pct_part * 100
            });

            sublistaProp.setSublistValue({
                id: propPrincipal.id,
                line: i,
                value: proponentes[i].custrecord_rsc_principal == 'T' ? 'Sim' : 'Não'
            });

            sublistaProp.setSublistValue({
                id: inativo.id,
                line: i,
                value: proponentes[i].isinactive == 'T' ? 'Sim' : 'Não'
            });
        }
    }
}

function ctrlEsc(bookeepingControl) {
    // log.audit('ctrlEsc', bookeepingControl);

    var relacao = {
        id_ctrl_esc: bookeepingControl.id,
        TAS: []
    };

    var id_ctrl_esc = bookeepingControl.id;

    bookeepingControl.setValue('custrecord_lrc_status_escrituracao', 26) // Escritura Transferida
    .save(opcoes)

    log.audit('ctrlEsc', {status: 'Sucesso', ctrlEsc: id_ctrl_esc, status_ctrl_esc: 'Escritura Transferida'});

    var bscTAS = search.create({type: "customrecord_lrc_tab_andamento_status",
        filters: [
           ["custrecord_lrc_controle_escrituracao","anyof",id_ctrl_esc]
        ],
        columns: [
            search.createColumn({name: "name", sort: search.Sort.ASC, label: "Nome"}),
           "custrecord_lrc_controle_escrituracao","custrecord_lrc_referente_faturamento","custrecord_lrc_referente_cliente","custrecord_lrc_status_alterado","custrecord_lrc_alterado_para_status"
        ]
    }).run().getRange(0,1000);
    log.audit('bscTAS', bscTAS);

    if (bscTAS.length > 0) {
        for (var prop in bscTAS) {
            if (bscTAS.hasOwnProperty(prop)) {
                record.submitFields({type: 'customrecord_lrc_tab_andamento_status',
                    id: bscTAS[prop].id,
                    values: {
                        custrecord_lrc_alterado_para_status: 26 // Escritura Transferida
                    },
                    options: opcoes                    
                });

                relacao.TAS.push(bscTAS[prop].id);
            }                
        }
        log.audit('ctrlEsc', {status: 'Sucesso', ctrlEsc: relacao});
    }
}

function atualizarTransacao(tipo, idInterno, valores) {
    // log.audit('atualizarTransacao', {tipo: tipo, idInterno: idInterno, valores: valores});

    const loadReg = record.load({type: tipo, id: idInterno});

    var load_ctrl_esc = record.load({type: 'customrecord_lrc_controle_escrituracao', id: loadReg.getValue('custbody_lrc_fat_controle_escrituracao')});

    loadReg.setValue('custbody_rsc_status_contrato', valores.custbody_rsc_status_contrato)
    .save(opcoes);

    log.audit('atualizarTransacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, valores: valores});

    if (valores.custbody_rsc_status_contrato == 4) {
        ctrlEsc(load_ctrl_esc);
    }
}

const clientScript = () => {
    var bscArquivo = search.create({type: "folder",
        filters: [
           ["file.name","is",nomeArquivo]
        ],
        columns: [
           search.createColumn({name: "internalid", join: "file", label: "ID interno"}),
           search.createColumn({name: "name", join: "file", label: "Nome"})
        ]
    }).run().getRange(0,1);
    // log.audit('bscArquivo', bscArquivo);

    return bscArquivo.length > 0 ? bscArquivo[0].getValue({name: "internalid", join: "file"}) : '';
}

const afterSubmit = (context) => {
    log.audit('afterSubmit', context);

    const registroAtual = context.newRecord;

    const tipo = context.type;

    if (tipo == 'create' || tipo == 'edit') {
        const statusCessao = registroAtual.getValue('custrecord_rsc_status_cessao');

        const contrato = registroAtual.getValue('custrecord_rsc_contrato');

        var campos = {};
        
        // Esperando aprovação
        if (statusCessao == 1) {
            campos.custbody_rsc_status_contrato = 4; // Cessão de Direitos
        }

        // Aprovado
        if (statusCessao == 2) {
            campos.custbody_rsc_status_contrato = 2; // Contrato 
        }

        if (campos.custbody_rsc_status_contrato) {
            atualizarTransacao('salesorder', contrato, campos);
        }        
    }    
}

const beforeLoad = (context) => {
    log.audit('beforeLoad', context);

    const registroAtual = context.newRecord;

    const statusCessao = registroAtual.getValue('custrecord_rsc_status_cessao');

    const contrato = registroAtual.getValue('custrecord_rsc_contrato');

    const taxaCD = registroAtual.getValue('custrecord_rsc_taxa_cd');

    const form = context.form;

    // form.clientScriptFileId = 10973; // rsc_fatura_cessao_direito_ct.js

    form.clientScriptFileId = clientScript(); // GAF GE Controle Escrituração CT AR

    if (context.type == 'view') {
        // if (statusCessao == 2 && !taxaCD) {
        //     form.addButton({
        //         id: custPage+'implantacao',
        //         label: 'Implantação',
        //         functionName: 'implantacao'
        //     });
        // }

        if (statusCessao == 1) {
            if (!taxaCD) {
                form.addButton({
                    id: custPage+'aprovar',
                    label: 'Aprovar',
                    functionName: 'aprovar'
                });
            }           
    
            form.addButton({
                id: custPage+'rejeitar',
                label: 'Rejeitar',
                functionName: 'rejeitar'
            });
        }
    
        if (statusCessao == 2) {
            form.addButton({
                id: custPage+'rejeitar',
                label: 'Rejeitar',
                functionName: 'rejeitar'
            });
        }
    
        if (statusCessao == 3) {
            form.addButton({
                id: custPage+'aprovar',
                label: 'Aprovar',
                functionName: 'aprovar'
            });
        }
    
        if (statusCessao == 2 || statusCessao == 4) {
            form.addButton({
                id: custPage+'enviar_cessao',
                label: 'Enviar Cessão',
                functionName: 'enviarCessao'
            });
    
            form.addButton({
                id: custPage+'imprimir_cessao',
                label: 'Imprimir Cessão',
                functionName: 'imprimirCessao'
            });
        }
    
    }

    
    listaProponentes(form, contrato);
}

return {
    afterSubmit: afterSubmit,
    beforeLoad: beforeLoad
};

});