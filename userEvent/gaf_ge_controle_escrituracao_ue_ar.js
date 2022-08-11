/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript      
*/
const custPage = 'custpage_rsc_';
const nomeArquivo = "gaf_ge_controle_escrituracao_ct_ar.js";
const autor = -5; // Sistema
const hoje = new Date();
const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(['N/email', 'N/file', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'], (email, file, log, record, runtime, search, serverWidget) => {
const atualizarDados = (tipo, id, campos) => {
    // log.audit('atualizarDados', {tipo: tipo, id: id, campos: campos});

    record.submitFields({type: tipo,
        id: id,
        values: campos,
        options: opcoes            
    });

    log.audit('atualizarDados', JSON.stringify({status: 'Sucesso', tipo: tipo, id: id, campos: campos}));
}

const statusAnaliseDocumentos = (nr) => {
    // var bsc = search.create({type: "customrecord_lrc_controle_escrituracao",
    //     filters: [
    //        ["custrecord_lrc_fatura_de_venda","anyof",nr.id]
    //     ],
    //     columns: [
    //         "created","custrecord_lrc_fatura_de_venda","custrecord_lrc_cliente_ce","custrecord_lrc_empreendimento_fatura"
    //     ]
    // }).run().getRange(0,1);
    var bsc = search.lookupFields({type: 'customrecord_lrc_controle_escrituracao',
        id: nr.id,
        columns: ['custrecord_rsc_data_analise_documentos']
    })
    log.audit('bsc', bsc);

    var partesData = bsc.custrecord_rsc_data_analise_documentos.split("/");

    var data_analise_documentos = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    if (hoje > data_analise_documentos) {
        var tempo = Math.abs(hoje.getTime() - data_analise_documentos.getTime());

        var permanenciaStatus = Math.ceil(tempo / (1000 * 3600 * 24)) - 1;
        log.audit('permanenciaStatus', permanenciaStatus);

        var status = nr.getText('custrecord_lrc_status_escrituracao');

        switch(permanenciaStatus) {
            case 30:
                emailAutomatico( 
                    runtime.getCurrentUser().email, 
                    '1.04.2 - COMUNICADO POR E-MAIL (1)', 
                    '1.04.2 - Comunicado por email (1) após '+permanenciaStatus+' dias de permanência do controle de escrituração no status: \n"'+status+'".'
                ); 
            break;

            case 40:
                emailAutomatico( 
                    runtime.getCurrentUser().email, 
                    '1.04.2 - COMUNICADO POR E-MAIL (2)', 
                    '1.04.2 - Comunicado por email (2) após '+permanenciaStatus+' dias de permanência do controle de escrituração no status: \n"'+status+'".'
                ); 
            break;

            case 50:
                var campos = {
                   custrecord_lrc_status_escrituracao: 7 // 1.04.4 - Criar notificação Extra Judicial”
                }

                atualizarDados('customrecord_lrc_controle_escrituracao', nr.id, campos);              
            break;
        }
    }
}

const anexos = (idArquivo) => {
    return file.load(idArquivo);
}

const dadosEntidadeTransacao = (novoRegistro, tipo, campo) => {
    var lkpEntityTransaction = search.lookupFields({type: tipo,
        id: novoRegistro.getValue('custrecord_lrc_cliente_ce'),
        columns: [campo]
    });
    log.audit('lkpEntityTransaction', lkpEntityTransaction);

    var info;

    switch(campo) {
        case 'email':
            ret =  lkpEntityTransaction[campo];
        break;
    }

    return info;
}

const emailAutomatico = (destinatarios, assunto, corpo, anexos) => {
    // dadosEntidadeTransacao(nr, 'customer', 'email');

    email.send({
        author: autor, // Sistema
        // recipients: dadosEntidadeTransacao(nr, 'customer', 'email'),
        recipients: destinatarios,
        subject: assunto,
        body: corpo,
        attachments: anexos
        // cc: number[] | string[]
    });
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

const beforeLoad = (context) => {
    log.audit('beforeLoad', context);

    const novoRegistro = context.newRecord;

    const form = context.form;

    if (novoRegistro.id) {
        form.clientScriptFileId = clientScript(); // GAF GE Controle Escrituração CT AR

        const status = novoRegistro.getValue('custrecord_lrc_status_escrituracao');

        var matricula = novoRegistro.getValue('custrecord_lrc_matricula');
        var data_planejada_assinatura_procurador = novoRegistro.getValue('custrecord_lrc_data_procurador');
        var escritura = novoRegistro.getValue('custrecord_lrc_escritura');
    
        switch(status) {
            case '1': // 1.01 - Aguardando Individualização de Matrícula
                if (matricula) {
                    form.addButton({
                        id: custPage+'imovel_pronto_101',
                        label: 'Imóvel Pronto',
                        functionName: 'imovelPronto'
                    });
                }            
            break;
    
            case '3': // 1.01 - Aguardando Individualização de Matrícula
                if (matricula) {
                    form.addButton({
                        id: custPage+'imovel_pronto_103',
                        label: 'Imóvel Pronto',
                        functionName: 'imovelPronto'
                    });
                }            
            break;

            case '4': // 1.04 - Apto para Outorga de Escritura Definitiva
                emailAutomatico( 
                    runtime.getCurrentUser().email, 
                    'GAFISA - ANÁLISE DE DOCUMENTOS', 
                    'GAFISA - Análise de Documentos', 
                    [anexos(novoRegistro.getValue('custrecord_lrc_matricula'))]
                );   

                form.addButton({
                    id: custPage+'analise_documentos',
                    label: 'Análise de Documentos',
                    functionName: 'analiseDocumentos'
                }); 
            break;

            case '7': // 11.04.4 - Criar notificação Extra Judicial
                form.addButton({
                    id: custPage+'notificado_extrajudicialmente',
                    label: 'Notificado ExtraJudicialmente',
                    functionName: 'notificadoExtraJudicialmente'
                });  
            break;

            case '9': // 1.05 - Em Análise de Documentos
                // statusAnaliseDocumentos(novoRegistro, form);  

                form.addButton({
                    id: custPage+'minuta_aprovada',
                    label: 'Minuta Aprovada',
                    functionName: 'minutaAprovada'
                }); 
            break;

            case '10': // 1.06 - Minuta Aprovada
                if (data_planejada_assinatura_procurador) {
                    form.addButton({
                        id: custPage+'assinatura_gafisa_agendada',
                        label: 'Assinatura Gafisa Agendada',
                        functionName: 'assinaturaGafisaAgendada'
                    });
                }                 
            break;

            case '11': // 1.07 - Assinatura Gafisa Agendada
                form.addButton({
                    id: custPage+'escritura_definitiva_lavrada',
                    label: 'Escritura Definitiva Lavrada',
                    functionName: 'escrituraDefinitivaLavrada'
                });    
                
                emailAutomatico( 
                    runtime.getCurrentUser().email, 
                    'GAFISA - ESCRITURA DEFINITIVA LAVRADA', 
                    'GAFISA - Escritura Definitiva Lavrada', 
                    [anexos(novoRegistro.getValue('custrecord_lrc_matricula'))]
                ); 
            break;

            case '12': // 1.08 - Escritura Definitiva Lavrada
                if (escritura) {
                    form.addButton({
                        id: custPage+'escritura_definitiva_registrada',
                        label: 'Escritura Definitiva Registrada',
                        functionName: 'escrituraDefinitivaRegistrada'
                    });
                }                               
            break;

            case '14': // 2.01 - Iniciar Outorga
                form.addButton({
                    id: custPage+'pf_enviada',
                    label: 'PF Enviada',
                    functionName: 'pfEnviada'
                });                             
            break;
        }
    }    
}

const afterSubmit = (context) => {}

const beforeSubmit = (context) => {}

return {
    beforeLoad : beforeLoad,
    afterSubmit : afterSubmit,
    beforeSubmit : beforeSubmit
}
});