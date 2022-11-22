/**
 *@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/log', 'N/search', 'N/ui/dialog'], function(log, search, dialog) {
const registrosDuplicados = (cpfcnpj, nomeEmpresa, idInterno) => {
    log.audit('registrosDuplicados', {cpfcnpj: cpfcnpj, nomeEmpresa: nomeEmpresa, idInterno: idInterno});

    var filtros = !idInterno ? [
        ["custentity_enl_cnpjcpf","is",cpfcnpj], "AND",
        ["formulatext: {companyname}","isnot",nomeEmpresa]
    ] : [
        ["custentity_enl_cnpjcpf","is",cpfcnpj], "AND",
        ["internalid","noneof",idInterno]
    ]

    if (cpfcnpj != '00000000000000' || cpfcnpj != 00000000000000) {
        var bscFornecedor = search.create({type: "vendor",
            filters: filtros,
            columns: [
                "datecreated","internalid","custentity_enl_cnpjcpf",
                search.createColumn({name: "formulatext", formula: "{companyname}", label: "nome da empresa"})
            ]
        }).run().getRange(0,1);
        log.audit('bscFornecedor', bscFornecedor);

        return bscFornecedor.length > 0 ? 
        dialog.alert({
            title: 'Aviso!',
            message: 'CPF/CNPJ já cadastrado: <br> ' + cpfcnpj + '<br>' + bscFornecedor[0].getValue({name: 'formulatext'}) + '.'
        }) : 
        false;
    } else {
        return false;
    }    
}

function pageInit(context) {}

function saveRecord(context) {
    log.audit('saveRecord', context);

    const registroAtual = context.currentRecord;

    const eNovo = registroAtual.isNew;

    var cpfcnpj = registroAtual.getValue('custentity_enl_cnpjcpf');
    var nomeEmpresa = registroAtual.getValue('companyname');

    if (eNovo == true) {
        return registrosDuplicados(cpfcnpj, nomeEmpresa) != false ? false : true;
    } else {
        return registrosDuplicados(cpfcnpj, nomeEmpresa, registroAtual.id) != false ? false : true; 
    }    
}

function validateField(context) {}

function fieldChanged(context) {}

function postSourcing(context) {}

function lineInit(context) {}

function validateDelete(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function sublistChanged(context) {}

return {
    // pageInit: pageInit,
    saveRecord: saveRecord,
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
