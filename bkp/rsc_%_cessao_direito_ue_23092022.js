/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
const custPage = 'custpage_rsc_';

define(['N/log', 'N/query', 'N/runtime', 'N/search', 'N/ui/serverWidget'], (log, query, runtime, search, serverWidget) => {
const localizarProponentes = (idContrato) => {
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

const listaProponentes = (form, idContrato) => {
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

const beforeLoad = (context) => {
    log.audit('beforeLoad', context);

    const registroAtual = context.newRecord;

    const statusCessao = registroAtual.getValue('custrecord_rsc_status_cessao');

    const contrato = registroAtual.getValue('custrecord_rsc_contrato');

    const taxaCD = registroAtual.getValue('custrecord_rsc_taxa_cd');

    const form = context.form;

    form.clientScriptFileId = 10973; // rsc_fatura_cessao_direito_ct.js

    if (context.type == 'view' && statusCessao == 2 && !taxaCD) {
        form.addButton({
            id: custPage+'implantacao',
            label: 'Implantação',
            functionName: 'implantacao'
        });
    }

    if (statusCessao == 1) {
        form.addButton({
            id: custPage+'aprovar',
            label: 'Aprovar',
            functionName: 'aprovar'
        });

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

    listaProponentes(form, contrato);
}

return {
    beforeLoad: beforeLoad
};

});