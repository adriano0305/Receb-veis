/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 Jun 2016     Eder Oliveira
 *
 */

var altera = true;

function onTab(type, name){

	if( name == "zip" && altera ){

		altera = false;
				
		nlapiSetFieldValue(   "zip", nlapiGetFieldValue("zip").replace("-", "")   );

		var cep = nlapiGetFieldValue("zip");
			
		var json = nlapiRequestURL("http://enlconsultacep.azurewebsites.net/api", cep, null, null, "POST");

		if(json.code==200 && nlapiGetFieldValue("zip").length==8){

			json = JSON.parse( json.body );

			nlapiSetFieldValue("addr1", json.end || "");
			//nlapiSetFieldValue("addr2", json.complemento2 || json.complemento || "");
			nlapiSetFieldValue("addr3", json.bairro || "");

			var col = new Array();
			col[0] = new nlobjSearchColumn('internalid');
			var filter = new Array();
			filter[0] = new nlobjSearchFilter('name', null, 'is', json.uf);
			var results = nlapiSearchRecord('customlist_enl_state', null, filter , col);
			var res = "";
          	
			
			if(results){
				res = results[0].getValue('internalid');
				nlapiSetFieldValue("custrecord_enl_uf", res || "");
			}

			col = new Array();
			col[0] = new nlobjSearchColumn('internalid');
			filter = new Array();
			filter[0] = new nlobjSearchFilter('name', null, 'is', json.cidade );
                        filter[1] = new nlobjSearchFilter('custrecord_enl_citystate', null, 'is', res);
			results = nlapiSearchRecord('customrecord_enl_cities', null, filter , col);
			res = "";
			
			if(results){
				res = results[0].getValue('internalid');
				nlapiSetFieldValue("custrecord_enl_city", res || "");
            }
          

		}
      	  
             
		else{
			alert("CEP inválido, por favor digite o CEP corretamente.");
			
			nlapiSetFieldValue("zip", "");
			nlapiSetFieldValue("addr1", "");
			nlapiSetFieldValue("addr2", "");
			nlapiSetFieldValue("addr3", "");

			nlapiSetFieldValue("custrecord_enl_uf", null || "");
			nlapiSetFieldValue("custrecord_enl_city", null);
		}

		altera = true;

	}

}

function saveCity(){
  
  var usercity = nlapiGetFieldValue('custrecord_enl_city');
  var cities = nlapiLoadRecord('customrecord_enl_cities', usercity);
  
  if(cities.getFieldValue('custrecord_enl_citystate') == nlapiGetFieldValue('custrecord_enl_uf')){
   	//alert('dentro')
   	return true;
  }
  else 
    alert("A cidade selecionada não faz parte da UF");
}

