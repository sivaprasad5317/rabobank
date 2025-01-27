"use strict";
/* globals nuanceData:true */

/*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
*                                              *
*    SOS Monitor ES6-module implementation     *
*                                              *
*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*/


function log(txt) {
    console.log("nuanceSOSMonitor.js: " + txt);
}
  
async function getSOSMonitor() {
    const baseurl = "https://raboweb.sharepoint.com/sites/pocsos/_api/web/lists";

    const baseOptions = {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            "Accept": "application/json;odata=verbose" // --> rows in array json.d.results
            // "Accept": "application/json" // --> rows in array json.value
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        // body: JSON.stringify(data) // body data type must match "Content-Type" header
    };
    
    function sharepointListByTitleGetUrl (title, params) {
        let urlParams = new URLSearchParams(params);
        let url = new URL(`${baseurl}/GetByTitle('${title}')/items?${urlParams}`);
        return url;
    }
    
    function sharepointListByTitleFetch (title, params) {
        let url = sharepointListByTitleGetUrl (title, params);
        return fetch(url,
            // Object.assign({}, baseOptions, {})
            baseOptions
        );
    }

    async function sharepointListByTitleGetResults(title, params) {
        let results = [];
        let url = sharepointListByTitleGetUrl (title, params);
        while(url) {
            let response = await fetch(url, baseOptions);
            let json = await response.json();
            results.push.apply(results, json.d.results);
            url = json.d.__next;
        }
        return results;
    }
    async function sharepointListByTitleGetFirst(title, params) {
        let url = sharepointListByTitleGetUrl (title, params);
        let response = await fetch(url, baseOptions);
        let json = await response.json();
        return (json?.d?.results?.[0]);
    }

    let SOSMonitor = [];
    let applications = await sharepointListByTitleGetResults("Applications", {
        "$filter": "Status ge 1 and Status le 4",
        // "$filter": "Status ne 0",
        // "$top": 1
        "$select": "ID,Status,Title",
        // "$orderby": "Latest_x0020_Update desc"
    });

    // run in parallel:
    await Promise.all(
        applications.map(async application => {
            try {
                const issue = await sharepointListByTitleGetFirst("Issues", {
                    // "$filter": "Status ge 1 and Status le 4"
                    "$top": 1,
                    "$filter": "ApplicationId eq " + application.ID,
                    "$select": "ID,Description,Description_EN,Latest_x0020_Update",
                    "$orderby": "Latest_x0020_Update desc"
                });
                let issueUpdate;
                if(issue?.ID) {
                    issueUpdate = await sharepointListByTitleGetFirst("Issue Updates", {
                        "$top": 1,
                        "$filter": "Issue_x0020_ID eq " + issue.ID,
                        //"$select": "ID,Description,Description_EN,Latest_x0020_Update",
                        "$select": "Descripion,Description_EN",
                        "$orderby": "UpdateDate desc"
                    });
                }

                SOSMonitor.push({
                    id: application.ID, /* used only for logging + tagging in Nina */
                    status: parseInt(application.Status),
                    name: application.Title,
                    description:    issueUpdate?.Descripion     || issue?.Description   ,
                    description_en: issueUpdate?.Description_EN || issue?.Description_EN,
                });
            } catch (e) {}
        })
    );

    return SOSMonitor;
}

// mapping appname to array of hotwords / aliases
var applications;
function normalizeAppName(appname) {
    var normalizedAppName = appname.trim();
    // fix strange characters:
    normalizedAppName = normalizedAppName.replace(/â€“/g,"-");
    // fix multiple spaces:
    normalizedAppName = normalizedAppName.replace(/\s+/g," ");
    // lowercase
    normalizedAppName = normalizedAppName.toLowerCase();
    return normalizedAppName;
}

function nameToHotwords (name, hotwords, regexs, tagNames) {
    function getTagName (name) {
        return "sos_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_$/, "");
    }
    console.log("nameToHotwords(" + name + ")");
    name = name.trim();
    if (name.match(/\s/)) {
        // multi word or optionally with shortform
        hotwords.push(name);
        console.log("nameToHotwords: added phrase: " + name);

        const multi = name.match(/^(.*)\((.*)\)$|^\((.*)\)(.*)$/);
        // (NL) is a language remark and not a short form.
        if (multi &&
            (multi[1] != "nl" && multi[2] != "nl") // (NL)
            // this exclusion is 3 years old - for PS_RABOBANK_CCSD-60 we allow the word splitting again for sbf
            // && (multi[1].trim() != "sbf" && multi[2].trim() != "sbf") // sbf (sub-part)
        ) {
            // short form and multi word
            nameToHotwords(multi[1], hotwords, regexs, tagNames);
            nameToHotwords(multi[2], hotwords, regexs, tagNames);
        } else {
            // multi word
            // embed regex with word boundaries \b
            const re = '\\b' + name + '\\b';
            regexs.push(re);
            console.log("nameToHotwords: added regex for: " + name);

            const tagName = getTagName(name);
            tagNames.push(tagName);
            console.log("nameToHotwords: added tag: " + tagName);
            
            const subwords = name.split(/[\s/|,.-]+/);
            for (let index = 0; index < subwords.length; index++) {
                const subword = subwords[index];
                nameToHotwords(subword, hotwords, regexs, tagNames);
            }
        }
    } else {
        // single word
        hotwords.push(name);
        console.log("nameToHotwords: added to word: " + name);
        const tagName = getTagName(name);
        tagNames.push(tagName);
        console.log("nameToHotwords: added tag: " + tagName);
    }
}
  
function addHotWords(normalizedAppName, hotwords, regexs, tagNames) {
    var aliases = applications[normalizedAppName];
    if( aliases) {
        for (const alias of aliases) {
            hotwords.push(alias); // already lowercase
        }
    };
    // todo: extract aliases / howord from "a long name (ALN)" as "a long name" and "aln"
    nameToHotwords(normalizedAppName, hotwords, regexs, tagNames);
    return hotwords;
}

function sosSetHotWords(SOSMonitor) {
    if(!applications) {
        applications = {};
        // copy over all aliases per application - normalize application name,
        for (const appname in nluConfig.applications) {
            if (Object.hasOwnProperty.call(nluConfig.applications, appname)) {
                const element = nluConfig.applications[appname];
                let normalizedAppName = normalizeAppName(appname);
                let aliases = applications[normalizedAppName];
                if( ! aliases) {
                    applications[normalizedAppName] = aliases = [];
                };
                for (const alias of element) {
                    aliases.push(alias.toLowerCase());
                }
            }
        }
        for (const alias in nluConfig.aliases) {
            if (Object.prototype.hasOwnProperty.call(nluConfig.aliases, alias)) {
                const aliasApplications = nluConfig.aliases[alias];
                for (const appname of aliasApplications) {
                    let normalizedAppName = normalizeAppName(appname);
                    if( ! applications[normalizedAppName]) {
                        applications[normalizedAppName] = [];
                    };
                    applications[normalizedAppName].push(alias.toLowerCase());
                }
            }
        }    
    }
    for (const SOSMonitorEntry of SOSMonitor) {
        const name = SOSMonitorEntry.name;
        const normalizedAppName =  normalizeAppName(name);
        const hotwords = (applications[normalizedAppName] || []).concat([]);
        const regexs = [];
        const tagNames = [];
        addHotWords(normalizedAppName, hotwords, regexs, tagNames);
        SOSMonitorEntry.normalizedAppName = normalizedAppName;
        // SOSMonitorEntry.name = normalizedAppName; // NO-NO-NO!
        // eliminate duplicates using Set
        SOSMonitorEntry.hotwords = [...new Set(hotwords)];
        SOSMonitorEntry.regexs = [...new Set(regexs)];
        SOSMonitorEntry.tagNames = [...new Set(tagNames)];
    }
}

var sosMonitorPromise = getSOSMonitor().then((SOSMonitor) => {
    log("sosmonitor received:" + JSON.stringify(SOSMonitor, 0, 2));
    
    sosSetHotWords(SOSMonitor);
    window.nuanceData = window.nuanceData || {};
    window.nuanceData.SOSMonitor = SOSMonitor;
    window.nuanceData.sosmonitor = JSON.stringify(SOSMonitor);

    log("sosmonitor extended:" + JSON.stringify(SOSMonitor, 0, 2));
  
    // // update nuanceData in IFrame if already there
    // if(NuanMessaging){
    //   NuanMessaging.SDKAPI.publishNewPageData({"nuanceData":window.nuanceData});
    //   NuanMessaging.SDKAPI.reInitChat();
    // }
}).catch((error) => {
    console.log(error);
    // outside of Rabobank try some simulation
});

"use strict";

// this is a map having something the user migth type as key and a list of applications that might be meant or related as value.
const nluConfig = {
    aliases: {
        "microsoft": ["microsoft outlook", "microsoft excel" , "Microsoft 365 Apps for enterprise" , "Microsoft Edge" , "Publisher - Microsoft 365" , "Visio - Microsoft 365"],
        "consumptief": ["consumptief - oriÃ«ntatie lening", "consumptief - oversluiten lening" , "Consumptief - Inzage lening Internetbankieren", "Consumptief - Inzage lening Rabo Mobielbankieren" , "Consumptief - Opnemen lening Internetbankieren" , "Consumptief - Opnemen lening Rabo Mobielbankieren", "Consumptief - Secure aanvraag lening" , "Consumptief - Upload documenten lening"],
        "kvk": ["kvk viewer"],
        "ACV": ["ACV Investigator", "ACV RiskShield Case Management"],
        "Adviesroute": ["Adviesroute Arbeidsongeschiktheid","Adviesroute FinanciÃ«le Planning", "Adviesroute Wonen"],
        "AML": ["AML NetReveal Americas (AMER)", "AML NetReveal Rest of the World (ROW)", "AML NL", "AML/CTF TM Wholesale Rural Riskshield"],
        "Analyse Tool": ["Analyse Tool Duurzaamheid", "Analyse Tool Rabobank"],
        "ARIS": ["ARIS Connect", "ARIS Designer"],
        "Betalen": ["Betalen â€“ Creditcard", "Betalen â€“ Prepaid", "Betalen en ontvangen"],
        "CDD": ["CDD BI-Hub", "CDD Robot", "CDD WFM"],
        "CPS": ["CPS Leningen", "CPS Medewerker", "CPS Royeren", "CPS-Zekerheden (Combinatie Produkt Systeem)"],
        "CROS": ["CROS IVR", "CROS Producten", "CROS Rekeningbeheer", "CROS RPK", "CROS Selecties"], 
        "euportal": ["euportal.rabobank.com external", "euportal.rabonet.com internal"],
        "HTC": ["HTC Advies", "HTC Offerte/Akte"], 
        "internetbankieren": ["InternetBankieren Lenen (Leningsgegevens op Internet (DLL))", "InternetBankieren Verzekeren Leven (Internet Verzekeren Leven Interpolis)", "InternetBankieren Verzekeren Zorg (Internet Verzekeren ZorgActief Interpolis)", "InternetBankieren Zakelijke Financieringsproducten"],
        "K&Mi": ["K&Mi Bedrijven", "K&Mi Bedrijven KYC", "K&Mi Communicatie Bedrijven", "K&Mi Communicatie PPB", "K&MI PPB"],
        "RBB": ["RBB for Support", "RBB Insight"],
        "SBF": ["SBF (Beheer Kredieten)", "SBF (Beheer Zekerheden)", "SBF (Rente verlengen)", "SBF (Services BedrijfsFinanciering)", "SBF (Standaard Bankverklaring)", "SBF (Vervroegd Aflossen Online)", "SBF (Vrijgave Zekerheden)"], 
        "XL": ["XL Deply", "XL Release"],
        "Archer": ["Archer RCF", "RCF", "Archer"],
        "Genesys": ["WFM", "Genesys", "Cloud"],
        "Office": ["365", "Delve", "Dynamics", "Forms", "Lists", "MyAnalytics", "OVD", "OneDrive", "OneNote", "Planner", "Power Automate", "Power BI", "PowerApps", "Project", "Stream", "SharePoint Online", "Stream", "Sway", "TEAMS", "To-do", "Whiteboard", "Yammer"],
    },
    // this is a map having application names as key and a list of aliases for it as value
    applications: {
        "Alles in Ã©Ã©n Polis": ["AIEP", "Alles in een Polis"],
        "Archer RCF": [ "Archer", "RCF"],
        "BKR/EVA/VIS/SFH": ["BKR", "EVA", "VIS", "SFH"],
        "Care â€“ Omnitracker": ["Care", "Omnitracker", "Care Omnitracker"],
        "Check Point Mobile": ["CPM", "Check Point"],
        "Genesys": ["WFM", "Genesys", "Cloud"],
        "Mijn Wonen Extra aflossen en Storten": ["Mijn Wonen", "Extra aflossen", "Storten"],
        "OneNote - Office 365": ["365", "Office", "OneNote"],
        "Yammer - Office 365": ["365", "Office", "Yammer"],
        "Whiteboard - Office 365": ["365", "Office", "Whiteboard"],
        "To-do - Office 365": ["365", "Office", "To-do"],
        "TEAMS - Office 365": ["365", "Office", "TEAMS"],
        "Sway - Office 365": ["365", "Office", "Sway"],
        "SharePoint Online - Office 365": ["365", "Office", "SharePoint Online"],
        "Stream - Office 365": ["365", "Office", "Stream"],
        "Project - Office 365": ["365", "Office", "Project"],
        "PowerApps - Office 365": ["365", "Office", "PowerApps"],
        "Power BI - Office 365": ["365", "Office", "Power BI"],
        "Power Automate - Office 365": ["365", "Office", "Power Automate"],
        "Planner - Office 365": ["365", "Office", "Planner"],
        "Delve - Office 365": ["365", "Office", "Delve"],
        "Dynamics - Office 365": ["365", "Office", "Dynamics"],
        "Forms - Office 365": ["365", "Office", "Forms"],
        "Lists - Office 365": ["365", "Office", "Lists"],
        "MyAnalytics - Office 365": ["365", "Office", "MyAnalytics"],
        "OVD - Office 365": ["365", "Office", "OVD"],
        "OneDrive - Office 365": ["365", "Office", "OneDrive"],
        "Rabo@Anywhere app": ["Anywhere"],
        "SAP HR": ["SAP", "SAP HR"],
    }
};

// await getSOSMonitor();

//export { getSOSMonitor };
