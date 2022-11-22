// Dentro do map
var r_21910 = {"subsidiary":"J020","id":21910,"inicioapropriacao":"01/10/2020","baixadacorretagem_28005_1767_75_f_f_f_f_null":null,"imoveisconstrucaopermutafisica_19506_29377_8_f_f_f_f_null":3272696.4264685,"revadiantclient_27825_28734_76_t_f_f_f_null":null,"baixadocustofinanceirosfh_879_28978_6_f_f_f_f_null":5249510.2549574,"baixadocustofinanceirocapitalizacao_885_28978_7_f_f_f_f_null":869655.3742064,"estornomensuracaopermuta_19492_27827_78_f_t_f_f_null":-1415907.97,"baixapermutafisica_28441_29156_9_f_f_f_t_null":-3272696.4264685,"imoveisdeincorporacao_19554_28999_10_f_f_f_f_null":396581.2236473,"custoconstrução_871_28424_3_f_f_f_f_f":7495320.2889313,"baixadocustodoterreno_841_28975_5_f_f_f_f_null":19685469.7260825,"obrigacaoconstrucao_28423_28969_72_f_f_f_f_null":37846162.0329022}
var keyNames_21910 = Object.keys(r_21910);
for (var i = 0; i < keyNames_21910.length; i++) {
    if (i >= 1) { 
        var contas = keyNames_21910[i].split('_');
        console.log(JSON.stringify({contas: contas}));
        var partida = contas[1];
        var contrapartida = contas[2];
        var componenteId = contas[3];
        var operacaoInvertida = contas[4];
        var lancarDiferenca = contas[5];
        var lancarMaiorZero = contas[6];
        var contaCredora = contas[7];
        var rateio = contas[8];
        var valor = (record[keyNames_21910[i]] == null ? 0 : record[keyNames_21910[i]]);
        // console.log(JSON.stringify({
        //     linha: i,
        //     contas: contas,
        //     partida: partida,
        //     contrapartida: contrapartida,
        //     componenteId: componenteId,
        //     operacaoInvertida: operacaoInvertida,
        //     lancarDiferenca: lancarDiferenca,
        //     lancarMaiorZero: lancarMaiorZero,
        //     contaCredora: contaCredora,
        //     rateio: rateio,
        //     valor: valor
        // }));
    }
}

var r_21922 = {"subsidiary":"G430","id":21922,"inicioapropriacao":"01/11/2020","baixadacorretagem_28005_1767_75_f_f_f_f_null":null,"imoveisconstrucaopermutafisica_19506_29377_8_f_f_f_f_null":null,"revadiantclient_27825_28734_76_t_f_f_f_null":null,"baixadocustofinanceirosfh_879_28978_6_f_f_f_f_null":173.818617,"baixadocustofinanceirocapitalizacao_885_28978_7_f_f_f_f_null":6020.7192297,"estornomensuracaopermuta_19492_27827_78_f_t_f_f_null":null,"baixapermutafisica_28441_29156_9_f_f_f_t_null":null,"imoveisdeincorporacao_19554_28999_10_f_f_f_f_null":104046.9068688,"custoconstrução_871_28424_3_f_f_f_f_f":9754985.6793396,"baixadocustodoterreno_841_28975_5_f_f_f_f_null":1282893.5596197,"obrigacaoconstrucao_28423_28969_72_f_f_f_f_null":16273302.7416246}	
var keyNames_21922 = Object.keys(r_21922);
for (var i = 0; i < keyNames_21922.length; i++) {
    if (i >= 1) { 
        var contas = keyNames_21922[i].split('_');
        console.log(JSON.stringify({contas: contas}));
        var partida = contas[1];
        var contrapartida = contas[2];
        var componenteId = contas[3];
        var operacaoInvertida = contas[4];
        var lancarDiferenca = contas[5];
        var lancarMaiorZero = contas[6];
        var contaCredora = contas[7];
        var rateio = contas[8];
        var valor = (record[keyNames_21922[i]] == null ? 0 : record[keyNames_21922[i]]);
        console.log(JSON.stringify({
            linha: i,
            contas: contas,
            partida: partida,
            contrapartida: contrapartida,
            componenteId: componenteId,
            operacaoInvertida: operacaoInvertida,
            lancarDiferenca: lancarDiferenca,
            lancarMaiorZero: lancarMaiorZero,
            contaCredora: contaCredora,
            rateio: rateio,
            valor: valor
        }));
    }
}


// componentes = 72, 10, 9,