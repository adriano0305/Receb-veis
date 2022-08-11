/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript     
*/

const custPage = 'custpage_rsc_';

define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'], function(log, record, runtime, search, serverWidget) {
const pastaArquivos = () => {
    var bsc_pasta_arquivos = search.create({type: "folder",
        filters: [
            ["file.name","is","gaf_rec_baixa_manual_ar.js"]
        ],
        columns: [
            search.createColumn({name: "internalid", join: "file", label: "ID interno"}),
            search.createColumn({name: "name", join: "file", label: "Nome"})
        ]
    }).run().getRange(0,1);
    log.audit('bsc_pasta_arquivos', bsc_pasta_arquivos);

    return bsc_pasta_arquivos[0].getValue({name: "internalid", join: "file"});
}

const validarDataVencimento = (duedate) => {
    const partesDuedate = duedate.split("/");

    const dataVencParcela = new Date(partesDuedate[2], partesDuedate[1] - 1, partesDuedate[0]);

    const hoje = new Date();

    var diaVencParcela = dataVencParcela.getDate();
    var mesVencParcela = dataVencParcela.getMonth()+1;
    var anoVencParcela = dataVencParcela.getFullYear();

    var diaHoje = hoje.getDate();
    var mesHoje = hoje.getMonth()+1;
    var anoHoje = hoje.getFullYear();

    log.audit('resultados', {
        diaVencParcela: diaVencParcela,
        mesVencParcela: mesVencParcela,
        anoVencParcela: anoVencParcela,
        diaHoje: diaHoje,
        mesHoje: mesHoje,
        anoHoje: anoHoje
    });

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

function beforeLoad(context) {
    log.audit('beforeLoad', context);

    const novoRegistro = context.newRecord;

    var ambiente = runtime.envType;

    const form = context.form;

    if (novoRegistro.id) {
        var status = novoRegistro.getText('status');

        var pago = novoRegistro.getValue('custbody_rsc_pago');
    
        var duedate = new Date(novoRegistro.getValue('duedate'));
        log.audit('duedate', duedate);

        var dataObj = {
            dia: duedate.getDate() <= 9 ? '0'+duedate.getDate() : duedate.getDate(),
            mes: (duedate.getMonth()+1) <= 9 ? '0'+(duedate.getMonth()+1) : duedate.getMonth()+1,
            ano: duedate.getFullYear()
        }
        log.audit('dataObj', dataObj);
    
        var validateDuedate = validarDataVencimento(
            String(dataObj.ano + '/' + dataObj.mes + '/' + dataObj.dia)
        );    
    
        log.audit('dados', {
            status: status,
            pago: pago,
            duedate: duedate,
            validateDuedate: validateDuedate
        });

        if ((status == 'Em aberto' || status == 'Open') && (!pago || pago == 2) && validateDuedate == false) {
            form.clientScriptFileId = pastaArquivos();

            form.addButton({
                id: custPage+'baixa_manual',
                label: 'Atualizar Parcela',
                functionName: 'baixaManual'
            });
        }
    }
}

function afterSubmit(context) {}

function beforeSubmit(context) {}

return {
    beforeLoad : beforeLoad,
    afterSubmit : afterSubmit,
    beforeSubmit : beforeSubmit
}
});