/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript      
*/

const hoje = new Date();

const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(['N/currentRecord', 'N/log', 'N/record', 'N/search', 'N/ui/dialog'], (currentRecord, log, record, search, dialog) => {
const dadosEntidade = (registroAtual, tipo, id, campo) => {
    var lkpEntity = search.lookupFields({type: tipo,
        id: id,
        columns: [campo]
    });
    console.log('lkpEntity', JSON.stringify(lkpEntity));

    var campos = {};

    switch(campo) {

    }    
}

const atualizarPagina = () => {
    document.location.reload(true);
}

const atualizarDados = (tipo, id, campos) => {
    // log.audit('atualizarDados', {tipo: tipo, id: id, campos: campos});

    record.submitFields({type: tipo,
        id: id,
        values: campos,
        options: opcoes            
    });

    console.log('atualizarDados', JSON.stringify({status: 'Sucesso', tipo: tipo, id: id, campos: campos}));
}

const dadosTransacao = (registroAtual, tipo, campo) => {
    var lkpTransaction = search.lookupFields({type: tipo,
        id: registroAtual.getValue('custrecord_lrc_fatura_de_venda'),
        columns: [campo]
    });
    console.log('lkpTransaction', JSON.stringify(lkpTransaction));

    var campos = {};

    switch(campo) {
        case 'custbody_lrc_saldo_repasse':
            if (lkpTransaction[campo] > 0) {
                campos.custrecord_lrc_status_escrituracao = 4; // 1.04 - Apto para Outorga de Escritura Definitiva    
                atualizarDados('customrecord_lrc_controle_escrituracao', registroAtual.id, campos);                
                atualizarPagina();
            } else {
                alert('Não existe saldo para repasse!');
            }
        break;
    }
}

const lineInit = (context) => {}

const pageInit = (context) => {}

const postSourcing = (context) => {}

const saveRecord = (context) => {}

const sublistChanged = (context) => {}

const validateDelete = (context) => {}

const validateField = (context) => {}

const validateInsert = (context) => {}

const validateLine = (context) => {}

const fieldChanged = (context) => {}

const imovelPronto = () => {
    const registroAtual = currentRecord.get();

    dadosTransacao(registroAtual, 'salesorder', 'custbody_lrc_saldo_repasse');   
}

const analiseDocumentos = () => {
    const registroAtual = currentRecord.get();

    var campos = {
        custrecord_lrc_status_escrituracao: 9, // 1.05 - Em Análise de Documentos
        custrecord_rsc_data_analise_documentos: hoje
    }

    atualizarDados('customrecord_lrc_controle_escrituracao', registroAtual.id, campos);
    atualizarPagina();
}

const minutaAprovada = () => {
    const registroAtual = currentRecord.get();

    var campos = {
        custrecord_lrc_status_escrituracao: 10, // 1.06 - Minuta Aprovada
    }

    atualizarDados('customrecord_lrc_controle_escrituracao', registroAtual.id, campos);
    atualizarPagina();
}

const notificadoExtraJudicialmente = () => {
    const registroAtual = currentRecord.get();

    var campos = {
        custrecord_lrc_status_escrituracao: 8, // 1.04.5 - Notificado Extrajudicialmente
        custrecord_rsc_data_notificado_extrajudi: hoje
    }

    atualizarDados('customrecord_lrc_controle_escrituracao', registroAtual.id, campos);
    atualizarPagina();
}

const assinaturaGafisaAgendada = () => {
    const registroAtual = currentRecord.get();

    var campos = {
        custrecord_lrc_status_escrituracao: 11, // 1.07 - Assinatura Gafisa Agendada
    }

    atualizarDados('customrecord_lrc_controle_escrituracao', registroAtual.id, campos);
    atualizarPagina();
}

const escrituraDefinitivaLavrada = () => {
    const registroAtual = currentRecord.get();

    var campos = {
        custrecord_lrc_status_escrituracao: 12, // 1.08 - Escritura Definitiva Lavrada
    }

    atualizarDados('customrecord_lrc_controle_escrituracao', registroAtual.id, campos);
    atualizarPagina();
}

const escrituraDefinitivaRegistrada = () => {
    const registroAtual = currentRecord.get();

    var campos = {
        custrecord_lrc_status_escrituracao: 13, // 1.09 - Escritura Definitiva Registrada
    }

    atualizarDados('customrecord_lrc_controle_escrituracao', registroAtual.id, campos);
    atualizarPagina();
}

const pfEnviada = () => {
    const registroAtual = currentRecord.get();

    var campos = {
        custrecord_lrc_status_escrituracao: 17, // 2.04 - PF Enviada
    }

    atualizarDados('customrecord_lrc_controle_escrituracao', registroAtual.id, campos);
    atualizarPagina();
}

return {
    pfEnviada: pfEnviada,
    escrituraDefinitivaRegistrada: escrituraDefinitivaRegistrada,
    escrituraDefinitivaLavrada: escrituraDefinitivaLavrada,
    assinaturaGafisaAgendada: assinaturaGafisaAgendada,
    notificadoExtraJudicialmente: notificadoExtraJudicialmente,
    minutaAprovada: minutaAprovada,
    analiseDocumentos: analiseDocumentos,
    imovelPronto: imovelPronto,
    // lineInit: lineInit,
    pageInit: pageInit,
    // postSourcing: postSourcing,
    // saveRecord: saveRecord,
    // sublistChanged: sublistChanged,
    // validateDelete: validateDelete,
    // validateField: validateField,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    // fieldChanged: fieldChanged
};
});
