/*! datalist-countries v1.0 — creates <option> entries for all ISO 3166-1 alpha-2 regions.
Usage:
  <input list="countries">
  <datalist id="countries"></datalist>
  <script src="datalist-countries.js"></script>
  <script>populateCountryDatalist('countries','th');</script>
*/
(function(){ 
  const ISO2 = ["AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"];
  function labelFor(code, locales){ 
    try{ return new Intl.DisplayNames(locales, {type:'region'}).of(code) || code; }
    catch(e){ return code; }
  }
  function optionText(code, locales){ 
    const name = labelFor(code, locales);
    return name + ' (' + code + ')';
  }
  window.populateCountryDatalist = function(datalistId, locale){ 
    const dl = document.getElementById(datalistId); 
    if(!dl) return;
    const locales = Array.isArray(locale) ? locale : [locale || 'th','en'];
    while(dl.firstChild) dl.removeChild(dl.firstChild);
    const ASEAN = ['TH','LA','MM','KH','VN','MY','SG','ID','PH','BN','TL'];
    const set = new Set();
    function add(code){ 
      if(set.has(code)) return; set.add(code);
      const opt = document.createElement('option'); 
      opt.value = optionText(code, locales);
      dl.appendChild(opt);
    }
    ASEAN.forEach(add);
    ISO2.forEach(add);
  }
})();
