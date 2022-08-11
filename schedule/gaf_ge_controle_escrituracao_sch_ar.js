/**
 *@NApiVersion 2.1
*@NScriptType ScheduledScript
*/
const autor = -5; // Sistema
const hoje = new Date();
const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(['N/email', 'N/log', 'N/record', 'N/runtime', 'N/search'], (email, log, record, runtime, search) => {
const atualizarDados = (tipo, id, campos) => {
    // log.audit('atualizarDados', {tipo: tipo, id: id, campos: campos});

    record.submitFields({type: tipo,
        id: id,
        values: campos,
        options: opcoes            
    });

    log.audit('atualizarDados', {status: 'Sucesso', tipo: tipo, id: id, campos: campos});
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

const dadosProprietario = (id) => {
    return search.lookupFields({type: 'employee',
        id: id,
        columns: ['email']
    });
}

const dadosScript = () => {
    return search.create({type: "script",
        filters: [
           ["scriptid","is","customscript_rsc_gaf_ge_ctrl_esc_sch_ar"]
        ],
        columns: [
            "name","scriptid","scripttype","owner","isinactive"
        ]
    }).run().getRange(0,1);
}

const analiseDocumentos = () => {
    return search.create({type: "customrecord_lrc_controle_escrituracao",
        filters: [
            [
                ["custrecord_rsc_data_analise_documentos","isnotempty",""], "AND", 
                ["custrecord_lrc_status_escrituracao","anyof","9"], "OR", // 1.05 - Em Análise de Documentos
                ["custrecord_lrc_status_escrituracao","anyof","5"], "OR", // 1.04.2 - Comunicado por E-mail1
                ["custrecord_lrc_status_escrituracao","anyof","6"], "OR", // 1.04.3 - Comunicado por E-mail2
                ["custrecord_lrc_status_escrituracao","anyof","7"] // 1.04.4 - Criar notificação Extra Judicial
            ], "OR", 
            ["custrecord_lrc_status_escrituracao","anyof","17"] // 2.04 - PF Enviada
        ],
        columns: [
            "created","custrecord_lrc_fatura_de_venda","custrecord_lrc_cliente_ce","custrecord_lrc_empreendimento_fatura","custrecord_lrc_tipo_escrituracao","custrecord_lrc_status_escrituracao",
            "custrecord_lrc_data_escrituracao","custrecord_rsc_data_analise_documentos","custrecord_rsc_data_comunicado_email1","custrecord_rsc_data_comunicado_email2","custrecord_rsc_data_notificado_extrajudi"
        ]
    }).run().getRange(0,1000);
}

const execute = (context) => {
    log.audit('execute', context);   

    var bsc_controle_escrituracao = analiseDocumentos();
    log.audit('bsc_controle_escrituracao', bsc_controle_escrituracao);

    var bscScript = dadosScript();
    log.audit('bscScript', bscScript);

    var bscFuncionario = dadosProprietario(bscScript[0].getValue('owner'));
    log.audit('bscFuncionario', bscFuncionario);

    if (bsc_controle_escrituracao.length > 0) {
        var partesData, dataStatus, tempo, permanenciaStatus;

        for (var ctrl in bsc_controle_escrituracao) {
            var status = {
                text: bsc_controle_escrituracao[ctrl].getText('custrecord_lrc_status_escrituracao'),
                value: bsc_controle_escrituracao[ctrl].getValue('custrecord_lrc_status_escrituracao')
            }
            log.audit('status', status);

            switch(status.value) {
                case "9": // 1.05 - Em Análise de Documentos
                    partesData = bsc_controle_escrituracao[ctrl].getValue('custrecord_rsc_data_analise_documentos').split("/");                    
                    dataStatus = new Date(partesData[2], partesData[1] - 1, partesData[0]);
                    tempo = Math.abs(hoje.getTime() - dataStatus.getTime());        
                    permanenciaStatus = Math.ceil(tempo / (1000 * 3600 * 24)) - 1;
                    log.audit({ctrlEscrituracao: bsc_controle_escrituracao[ctrl].id}, {status: status, permanenciaStatus: permanenciaStatus});

                    if ((hoje > dataStatus) && permanenciaStatus == 30) {
                        emailAutomatico( 
                            bscScript[0].getValue('owner'), 
                            // bscFuncionario.email,
                            '1.04.2 - COMUNICADO POR E-MAIL (1)', 
                            '1.04.2 - Comunicado por email (1) após '+permanenciaStatus+' dias de permanência do controle de escrituração no status: \n"'+status.text+'".'
                        ); 

                        var campos = {
                            custrecord_lrc_status_escrituracao: 5, // 1.04.2 - Comunicado por E-mail1
                            custrecord_rsc_data_comunicado_email1: hoje
                        }

                        atualizarDados('customrecord_lrc_controle_escrituracao', bsc_controle_escrituracao[ctrl].id, campos); 
                    }
                break;

                case "5": // 1.04.2 - Comunicado por E-mail1
                    partesData = bsc_controle_escrituracao[ctrl].getValue('custrecord_rsc_data_comunicado_email1').split("/");                    
                    dataStatus = new Date(partesData[2], partesData[1] - 1, partesData[0]);
                    tempo = Math.abs(hoje.getTime() - dataStatus.getTime());        
                    permanenciaStatus = Math.ceil(tempo / (1000 * 3600 * 24)) - 1;
                    log.audit({ctrlEscrituracao: bsc_controle_escrituracao[ctrl].id}, {status: status, permanenciaStatus: permanenciaStatus});

                    if ((hoje > dataStatus) && permanenciaStatus == 10) {
                        emailAutomatico( 
                            bscScript[0].getValue('owner'), 
                            // bscFuncionario.email,
                            '1.04.2 - COMUNICADO POR E-MAIL (2)', 
                            '1.04.2 - Comunicado por email (2) após '+permanenciaStatus+' dias de permanência do controle de escrituração no status: \n"'+status.text+'".'
                        );
                        
                        var campos = {
                            custrecord_lrc_status_escrituracao: 6, // 1.04.3 - Comunicado por E-mail2
                            custrecord_rsc_data_comunicado_email2: hoje
                        }

                        atualizarDados('customrecord_lrc_controle_escrituracao', bsc_controle_escrituracao[ctrl].id, campos); 
                    }
                break;

                case "6": // 1.04.3 - Comunicado por E-mail2
                    partesData = bsc_controle_escrituracao[ctrl].getValue('custrecord_rsc_data_comunicado_email2').split("/");                    
                    dataStatus = new Date(partesData[2], partesData[1] - 1, partesData[0]);
                    tempo = Math.abs(hoje.getTime() - dataStatus.getTime());        
                    permanenciaStatus = Math.ceil(tempo / (1000 * 3600 * 24)) - 1;
                    log.audit({ctrlEscrituracao: bsc_controle_escrituracao[ctrl].id}, {status: status, permanenciaStatus: permanenciaStatus});

                    if ((hoje > dataStatus) && permanenciaStatus == 10) {
                        var campos = {
                            custrecord_lrc_status_escrituracao: 7 // 1.04.4 - Criar notificação Extra Judicial
                        }

                        atualizarDados('customrecord_lrc_controle_escrituracao', bsc_controle_escrituracao[ctrl].id, campos); 
                    }
                break;

                case "17": // 2.04 - PF Enviada
                    partesData = bsc_controle_escrituracao[ctrl].getValue('custrecord_lrc_data_escrituracao').split("/");                    
                    dataStatus = new Date(partesData[2], partesData[1] - 1, partesData[0]);
                    tempo = Math.abs(hoje.getTime() - dataStatus.getTime());        
                    permanenciaStatus = Math.ceil(tempo / (1000 * 3600 * 24)) - 1;
                    log.audit({ctrlEscrituracao: bsc_controle_escrituracao[ctrl].id}, {status: status, permanenciaStatus: permanenciaStatus});

                    if ((hoje > dataStatus) && permanenciaStatus == 15) {
                        var campos = {
                            custrecord_lrc_status_escrituracao: 15 // 2.02 - Iniciar Outorga – Contato via E-mail
                        }

                        atualizarDados('customrecord_lrc_controle_escrituracao', bsc_controle_escrituracao[ctrl].id, campos); 
                    }
                break;
            }
        }
    }    
}

return {
    execute: execute
}
});
