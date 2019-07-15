var inputData = [];
window.onload = function() {
    inputData = document.getElementsByClassName('inputData');
    writeActivityBox();
    setSelectedActivity('bowling');
}

var makeEventsEditable = function() {
    for (let i = 0; i < inputData.length; i++) {
        inputData[i].style.borderWidth = '1px';
        inputData[i].style.outline = '1';
        inputData[i].disabled = false;
        inputData[i].readOnly = false;
    }
    var z = document.getElementById('makeChangesButton');
    z.hidden = false;
    var x = document.getElementById('name-change');


    x.style.display = "initial"

}

var confirmDeletion = function() {
    // eslint-disable-next-line no-alert
    var cD = confirm("Are you sure you want to delete this event?");
    if (cD) {
        var d = document.getElementById('delete-event-form');
        d.submit();
    }

}

var validateForm = function() {

    var requiredData = document.getElementsByClassName('required');
    var alertedOnce = false;
    for (var i = 0; i < requiredData.length; i++) {
        requiredData[i].style.borderColor = "gray";
        //console.log(inputData[i].value);
        if (requiredData[i].value === null || requiredData[i].value === "") {

            requiredData[i].style.borderColor = "red";
            if (!alertedOnce) {
                // eslint-disable-next-line no-alert
                alert("Make Sure you fill in all required data");
                alertedOnce = true;
            }


        }
    }
    if (!alertedOnce) {
        var makeChangesForm = document.getElementById('makeChangesForm');
        makeChangesForm.submit();
    }


}

var setSelectedActivity = function(selectedActivity) {
    var allOpts = document.getElementsByTagName('option');

    for (let i = 0; i < allOpts.length; i++) {
        if (allOpts[i].value === selectedActivity) {
            allOpts[i].selected = 'true';
        }
    }
}

var writeActivityBox = function(firstTime) {

    var thing2 = document.getElementById("activity");
    //thing2.innerHTML = "<option style=\"display:none\">";
    switch (document.getElementById("category").value) {
        case "athletics":
            thing2.innerHTML = "<option value= \"baseball\">Baseball</option>" +
                "<option value= \"basketball\">Basketball</option>" +
                "<option value= \"bowling\">Bowling</option>" +
                "<option value= \"cross country\">Cross Country</option>" +
                "<option value= \"football\">Football</option>" +
                "<option value= \"golf\">Golf</option>" +
                "<option value= \"track and field\">Track and Field</option>" +
                "<option value= \"tennis\">Tennis</option>" +
                "<option value= \"volleyball\">Volleyball</option>" +
                "<option value= \"wrestling\">Wrestling</option>" +
                "<option value= \"soccer\">Soccer</option>" +
                "<option value= \"other\">Other</option>";

            break;
        case "arts":
            thing2.innerHTML =
                "<option value= \"orchestra\">Orchestra</option>" +
                "<option value= \"band\">Band</option>" +
                "<option value= \"drama\">Drama</option>" +
                "<option value= \"choir\">Choir</option>" +
                "<option value= \"dance\">Dance</option>" +
                "<option value= \"other\">Other</option>";
            break;
        case "academics":
            thing2.innerHTML =
                "<option value= \"tutoring\">Tutoring</option>" +
                "<option value= \"ACT\">ACT</option>" +
                "<option value= \"SAT\">SAT</option>" +
                "<option value = \"assembly\">Assembly</option>" +
                "<option value= \"other\">Other</option>";
            break;
        case "other":
            thing2.innerHTML =
                "<option value= \"dance\">Dance</option>" +
                "<option value= \"pepRally\">Pep Rally</option>" +
                "<option value= \"other\">Other</option>";
            break;
    }


}