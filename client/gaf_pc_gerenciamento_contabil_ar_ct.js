/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
*/
const alerta = {
    titulo: 'Aviso!',
    pp: 'Registro/Transação não permitido(a) para período contábil retroativo. <br> '+
        'Verifique o campo "Período de Postagem".',
    gc: 'Registro/Transação não permitido(a). <br> '+
    'Favor incluir papel/função no registro "Gerenciamento Contábil".'    
}

const hoje = new Date();

const objHoje = {
    dia: hoje.getDate() <= 9 ? '0'+hoje.getDate() : hoje.getDate(),
    mes: hoje.getMonth()+1 <= 9 ? '0'+(hoje.getMonth()+1) : hoje.getMonth()+1,
    ano: hoje.getFullYear()
}

define(['N/log', 'N/runtime', 'N/search', 'N/ui/dialog'], function(log, runtime, search, dialog) {
const pp = (postingPeriod, currentUser) => {
    log.audit('pp', objHoje);

    var mesAtual;

    switch(objHoje.mes) {
        case '01': mesAtual = String('jan '+objHoje.ano); break;
        case '02': mesAtual = String('fev '+objHoje.ano); break;
        case '03': mesAtual = String('mar '+objHoje.ano); break;
        case '04': mesAtual = String('abr '+objHoje.ano); break;
        case '05': mesAtual = String('mai '+objHoje.ano); break;
        case '06': mesAtual = String('jun '+objHoje.ano); break;
        case '07': mesAtual = String('jul '+objHoje.ano); break;
        case '08': mesAtual = String('ago '+objHoje.ano); break;
        case '09': mesAtual = String('set '+objHoje.ano); break;
        case 10: mesAtual = String('out '+objHoje.ano); break;
        case 11: mesAtual = String('nov '+objHoje.ano); break;
        case 12: mesAtual = String('dez '+objHoje.ano); break;
    }

    log.audit('mesAtual', mesAtual);

    if ((mesAtual != postingPeriod.text) && gerenciamentoContabil(currentUser) == 0) {
        log.audit(alerta.titulo, alerta.pp);

        dialog.alert({
            title: alerta.titulo,
            message: alerta.pp
        });

        return false;      
    }

    return true;
}

const gerenciamentoContabil = (currentUser) => {
    log.audit('gerenciamentoContabil', currentUser);

    var periodoInicio = String('01/' + objHoje.mes + '/' + objHoje.ano);
    var periodoFim = String('07/' + objHoje.mes + '/' + objHoje.ano);
    log.audit('periodos', {inicio: periodoInicio, fim: periodoFim});

    var bsc_gerenciamento_contabil = search.create({type: "customrecord_rsc_gerenciamento_contabil",
        filters: [
           ["custrecord_rsc_funcoes_papeis","anyof",currentUser.role], "AND", 
           ["custrecord_rsc_periodo_inicio","on",periodoInicio], "AND", 
           ["custrecord_rsc_periodo_fim","on",periodoFim]
        ],
        columns: [
            "created","custrecord_rsc_funcoes_papeis","custrecord_rsc_periodo_inicio","custrecord_rsc_periodo_fim"
        ]
    }).run().getRange(0,1);
    log.audit('bsc_gerenciamento_contabil', bsc_gerenciamento_contabil);

    return bsc_gerenciamento_contabil.length;
}

function lineInit(context) {}

function pageInit(context) {}

function postSourcing(context) {}

function saveRecord(context) {
    log.audit('saveRecord', context);

    const registroAtual = context.currentRecord;

    const eNovo = context.isNew;

    const usuarioAtual = runtime.getCurrentUser();

    var periodoPostagem = {
        text: registroAtual.getText('postingperiod'),
        value: registroAtual.getValue('postingperiod')
    }
    log.audit('periodoPostagem', periodoPostagem);
    
    if (eNovo == true) {
        pp(periodoPostagem, usuarioAtual);
    }    
    
    if (gerenciamentoContabil(usuarioAtual) == 0) {
        log.audit(alerta.titulo, alerta.gc);

        dialog.alert({
            title: alerta.titulo,
            message: alerta.gc
        });

        return false;
    }

    return true;
}

function sublistChanged(context) {}

function validateDelete(context) {}

function validateField(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function fieldChanged(context) {}

return {
    // lineInit: lineInit,
    // pageInit: pageInit,
    // postSourcing : postSourcing,
    saveRecord : saveRecord,
    // sublistChanged : sublistChanged,
    // validateDelete : validateDelete,
    // validateField : validateField,
    // validateInsert : validateInsert,
    // validateLine : validateLine,
    // fieldChanged : fieldChanged
};
});
