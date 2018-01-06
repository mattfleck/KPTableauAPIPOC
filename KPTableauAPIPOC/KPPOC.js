//To prevent a bug in IE where the global use of the 'viz' variable
//  interferes with the div id 'viz' (in the html), the following line is needed:
//  Note: this line does not appear in the tutorial videos but should still be used
//    and is in all of the included js files. 
var viz, workbook;
var tempSavedFilters;
var savedFilter = { filterName: '', filters: [], filterValues: [[], []] };
var aSavedFilters = [];
var curViewIndex = -1;
var newViewIndex = -1;
var oView = { id: -1, name: "", URL: "" };
var aViews = [];
var bIsCurViewFiltered = false;
var curFilterObj;

window.onload = function () {
    initViews();
    //initViz(aViews[2].URL);
    switchView(2);
}

function initViews() {
    var tView = { id: 0, name: "Hospital Unit Scorecard", URL: "http://52.183.64.63:9017/#/views/HospitalUnitScorecardV0_4/HospitalUnitScorecard?:iid=1" };
    aViews.push(tView);

    var tView = { id: 1, name: "Individual Hospital Report", URL: "http://52.183.64.63:9017/#/views/IndividualHospitalReportV0_4/IndividualHospitalScorecard?:iid=1" };
    aViews.push(tView);

    var tView = { id: 2, name: "Test Simple Dashboard", URL: "http://52.183.64.63:9017/#/views/HospitalUnitScorecardV0_4/SimpleTestDashboard?:iid=1" };
    aViews.push(tView);

    for (var lc = 0; lc < aViews.length; lc++) {

        var ul = document.getElementById("avaialbleViews");
        var li = document.createElement("li");
        var link = document.createElement("a");

        link.setAttribute('onClick', "switchView(" + lc + ")");
        link.innerHTML = aViews[lc].name;
        li.appendChild(link);
        ul.appendChild(li);
    }
}

function initViz(viewIndex, filterObj) {
    console.log("initViz");

    var vizDiv = document.getElementById('viz');

    var options = {
        /*	width: '1200px',
            height: '1080px',*/
        hideToolbar: true,
        hideTabs: true
        ,onFirstInteractive: function () {
            if (filterObj != null) {
                applySavedFilter(filterObj);
                bIsCurViewFiltered = false;
            }
        ;}
    };

    if (viz) {
        viz.dispose();
    }

    var vizURL = aViews[viewIndex].URL;

    viz = new tableauSoftware.Viz(vizDiv, vizURL, options);
    viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, onFilterChanged);

    //viz.addEventListener('tabswitch', function (event) {
    //    document.getElementById('sheetName').innerHTML = event.getNewSheetName();
    //});

    avaialbleViews = false;
    newViewIndex = -1
    curViewIndex = viewIndex;
};

function switchView(viewIndex) {
    console.log("switchView() curViewIndex=" + curViewIndex + " newViewIndex=" + viewIndex);

    if (bIsCurViewFiltered) {
        newViewIndex = viewIndex;
        saveCurrentViewState();
        bIsCurViewFiltered = false;
    }
    else {
        initViz(viewIndex);
    }
}

function showOnly(filterName, values) {
    sheet = viz.getWorkbook().getActiveSheet();
    if (sheet.getSheetType() === 'worksheet') {
        sheet.applyFilterAsync(filterName, values, 'REPLACE');
    } else {
        worksheetArray = sheet.getWorksheets();
        for (var i = 0; i < worksheetArray.length; i++) {
            worksheetArray[i].applyFilterAsync(filterName, values, 'REPLACE');
        }
    }
}

function alsoShow(filterName, values) {
    sheet = viz.getWorkbook().getActiveSheet();
    if (sheet.getSheetType() === 'worksheet') {
        sheet.applyFilterAsync(filterName, values, 'ADD');
    } else {
        worksheetArray = sheet.getWorksheets();
        for (var i = 0; i < worksheetArray.length; i++) {
            worksheetArray[i].applyFilterAsync(filterName, values, 'ADD');
        }
    }
}

function dontShow(filterName, values) {
    sheet = viz.getWorkbook().getActiveSheet();
    if (sheet.getSheetType() === 'worksheet') {
        sheet.applyFilterAsync(filterName, values, 'REMOVE');
    } else {
        worksheetArray = sheet.getWorksheets();
        for (var i = 0; i < worksheetArray.length; i++) {
            worksheetArray[i].applyFilterAsync(filterName, values, 'REMOVE');
        }
    }
}

function clearFilter(filterName) {
    sheet = viz.getWorkbook().getActiveSheet();
    if (sheet.getSheetType() === 'worksheet') {
        sheet.clearFilterAsync(filterName);
    } else {
        worksheetArray = sheet.getWorksheets();
        for (var i = 0; i < worksheetArray.length; i++) {
            worksheetArray[i].clearFilterAsync(filterName);
        }
    }
}

function selectMarks(filterName, values) {
    sheet = viz.getWorkbook().getActiveSheet();
    if (sheet.getSheetType() === 'worksheet') {
        sheet.selectMarksAsync(filterName, values, 'REPLACE');
    } else {
        worksheetArray = sheet.getWorksheets();
        for (var i = 0; i < worksheetArray.length; i++) {
            worksheetArray[i].selectMarksAsync(filterName, values, 'REPLACE');
        }
    }
}

function onFilterChanged(e) {
    console.log("onFilterChanged()");

    bIsCurViewFiltered = true;
    //var filterName = e.getFieldName();
    //var values;
    //var value;
    //var linkText;

    //e.getFilterAsync().then(function (filter) {
    //    values = filter.getAppliedValues();
    //    value = values[0]['value'];

    //    if (values.length > 1) {
    //        value = 'All';
    //    }

    //});

    //if (typeof value === 'number') {
    //    linkText = filterName + ' - ' + value.toString();
    //}
    //else
    //    linkText = filterName + ' - ' + value;
}

function toggleSelectionAlert() {
    if (listenerOn) {
        listenerOn = false;
        viz.removeEventListener('marksselection', alertFunc);
    } else {
        viz.addEventListener('marksselection', alertFunc);

        listenerOn = true;
    }
}

function saveCurrentViewState() {
    console.log("saveCurrentViewState() - curViewIndex=" + curViewIndex );

    var worksheets = viz.getWorkbook().getActiveSheet().getWorksheets();

    for (var i = 0; i < worksheets.length; i++) {

        var name = worksheets[i].getName();

        var filters = worksheets[i].getFiltersAsync().then(saveCurrentViewStateSheet);
    }
}

function saveCurrentViewStateSheet(filters) {

    console.log('saveCurrentViewStateSheet() curViewIndex=' + curViewIndex);

    var newFilter = packageFilter(filters);

    newFilter.filterName = aViews[curViewIndex].name;
    newFilter.viewIndex = curViewIndex;

    var newIndex = aSavedFilters.push(newFilter) - 1;

    var ul = document.getElementById("returnToView");
    var li = document.createElement("li");
    var link = document.createElement("a");
    var linkStr = "returnToView(" + newIndex + ")";
    link.setAttribute('onClick', linkStr ); // not sure why but when imbedding the link string it gets corrupted by calc for saveIndex
    link.innerHTML = newFilter.filterName;
    li.appendChild(link);
    ul.appendChild(li);
    
    initViz(newViewIndex);
}

function returnToView(returnIndex) {
    console.log("returnToView for index: " + returnIndex);
    initViz(aSavedFilters[returnIndex].viewIndex, aSavedFilters[returnIndex]);
}

function saveFilters() {
    console.log("saveFilters()");

    var worksheets = viz.getWorkbook().getActiveSheet().getWorksheets();

    for (var i = 0; i < worksheets.length; i++) {

        var name = worksheets[i].getName();

        var filters = worksheets[i].getFiltersAsync().then(saveFilterSheet);
    }

    bIsCurViewFiltered = false;
}

function saveFilterSheet(filters) {

    console.log('saveFilterSheet()');

    var newFilter = packageFilter(filters);

    var filterName = prompt("Please provide a name for this saved filter", "My Filter");

    if (filterName != null) {

        newFilter.filterName = filterName;
        newFilter.viewIndex = curViewIndex;
        var newIndex = aSavedFilters.push(newFilter) -1;

        var ul = document.getElementById("savedFilters");
        var li = document.createElement("li");
        var link = document.createElement("a");
        link.setAttribute('onClick', "applySavedFilterGetObj(" + newIndex + ")");
        link.innerHTML = newFilter.filterName;
        li.appendChild(link);
        ul.appendChild(li);
    }

    //var newFilter = new Object();
    //newFilter.filterName = filterName;
    //newFilter.filters = aFilterNames;
    //newFilter.filterValues = aFilterValues;
}

function packageFilter(filters) {

    console.log("packageFilter()");

    var filterData = '';
    var filterValue;
    var aFilterNames = new Array();
    var aFilterValues = [[], []];

    for (var i = 0; i < filters.length; i++) {

        filterData = '';
        var name = filters[i].getFieldName();
        var values = filters[i].getAppliedValues();
        var newFilter = new Object();

        if (name != 'Measure Names') {
            var myValues = "";

            for (var j = 0; j < values.length; j++) {

                if (myValues != "") {

                    myValues += ",";
                }

                filterValue = String(values[j].value);  // ensure we are getting a string
                myValues += filterValue

                var filterData = name + " = " + myValues;
            }
            console.log(filterData);
            aFilterNames[i] = name;
            var tempArray = myValues.split(',');
            aFilterValues[i] = myValues.split(',');
            newFilter.filters = aFilterNames;
            newFilter.filterValues = aFilterValues;
        }
    }
    return newFilter;
}

function applySavedFilterGetObj(saveIndex) {
    applySavedFilter(aSavedFilters[saveIndex]);
}

function applySavedFilter(filterObj) {
    console.log("applySavedFilter()");
    
    curFilterObj = filterObj;

    var worksheets = viz.getWorkbook().getActiveSheet().getWorksheets();

    console.log("applySavedFilter() - worksheet count is:" + worksheets.length);

    for (var i = 0; i < worksheets.length; i++) {
        var name = worksheets[i].getName();
        var filters = worksheets[i].getFiltersAsync().then(applySavedFilterSheet);
    }
}

function applySavedFilterSheet(filters) {

    console.log("applySavedFilterSheet()");

    aFilterNames = curFilterObj.filters;
    aFilterValues = curFilterObj.filterValues;

    for (var a = 0; a < filters.length; a++) {

        var name = filters[a].getFieldName();

        var savedFiilterIndex = aFilterNames.indexOf(name);
        console.log("applySavedFilterSheet for " + name + " found on index #" + savedFiilterIndex);

        if (savedFiilterIndex >= 0) {

            var sheet = viz.getWorkbook().getActiveSheet();
            if (sheet.getSheetType() === 'worksheet') {
                sheet.applyFilterAsync(aFilterNames[savedFiilterIndex], aFilterValues[savedFiilterIndex], tableau.FilterUpdateType.REPLACE);
                //console.log("applySavedFilter() single sheet");
            }
            else {
                var workSheetArray = sheet.getWorksheets();
                //sheet.pauseAutomaticUpdatesAsync();

                for (var i = 0; i < workSheetArray.length; i++) {

                    var sheet = workSheetArray[i];

                    //console.log("applySavedFilter() sheet array for " + name);

                    sheet.applyFilterAsync(aFilterNames[savedFiilterIndex], aFilterValues[savedFiilterIndex], tableau.FilterUpdateType.REPLACE);
                }
                //sheet.resumeAutomaticUpdatesAsync();

            }
        }
    }
}

function resetFilters() {
    console.log("resetFilter()");

    var worksheets = viz.getWorkbook().getActiveSheet().getWorksheets();

    for (var i = 0; i < worksheets.length; i++) {

        var name = worksheets[i].getName();
        var filters = worksheets[i].getFiltersAsync().then(resetFilterSheet);
    }
}

function resetFilterSheet(filters) {

    console.log("resetFilterSheet()");

    for (var a = 0; a < filters.length; a++) {

        var name = filters[a].getFieldName();

        if (name != 'Measure Names') {
            clearFilter(name);
        }

        //var sheet = viz.getWorkbook().getActiveSheet();
        //if (sheet.getSheetType() === 'worksheet') {
        //    sheet.applyFilterAsync(name, "", tableau.FilterUpdateType.ALL);
        //}
        //else {
        //    var workSheetArray = sheet.getWorksheets();
        //    for (var i = 0; i < workSheetArray.length; i++) {

        //        var sheet = workSheetArray[i];
        //        sheet.applyFilterAsync(name, "", tableau.FilterUpdateType.ALL);
        //    }
    }
}

