  /* 
   AirWatch JS API Integration Test
   @date 2/11/17 - 7/12/17
   @author Adam Matthews
   @email matthewsa@vmware.com

   @todo - Device Counts - Last Seen since 30 days. 

  */

const runbtn = document.getElementById('runBtn');
const GIDList = document.getElementById('GID');
const server = "https://ds137.awmdm.com/"; //include /

function init(){
 // loadHeaders(); //load platform headers
}

/*
  Sets the local browser cache with retrieved data. 
*/
function setLocalStorage(location,data){
  localStorage.setItem(location, JSON.stringify(data));
}
/*
  Get data from local storage
*/
function getLocalStorage(location){
  console.log(location);
  return JSON.parse(localStorage.getItem(location));
}


/*
  Load platform headers
*/
function loadHeaders(){

  

  let headers = new Headers();
  headers.append('Authorization', 'Basic CHANGE'); //CHANGE THIS
  headers.append('aw-tenant-code', 'CHANGE');
  headers.append('Accept', 'application/json');
  return headers;
}

/*
  Call API and return data
*/
function callAPI(url,headers,location){

let callData = "";
  document.getElementById('progress').innerHTML = "In Progress";

  fetch(url, {method:'GET',
          headers: headers,
         credentials: 'same-origin'
       })
    .then(status)
      .then(json)
      .then(function(data) {
        console.log('Request succeeded with JSON response', data);
        document.getElementById('progress').innerHTML = "Done";
        setLocalStorage(location,data);
        return data;
      }).catch(function(error) {
        console.log('Request failed', error);
      });

  function status(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(new Error(response.statusText))
    }
  }

  function json(response) {
    return response.json()
  }

}

/*********** Profiles Stuff ******************/


//Get Profile Data (profiles search)
// @todo - run the search again with profile detail for each ID found. 
function getProfileData(){
  let headers = loadHeaders();
  callAPI(server + "api/mdm/profiles/search",headers,"profilesData"); //get main profiles list

    callAPI(server + "api/mdm/profiles/4219",headers);


}


/*********** Devices Stuff ******************/
/*
  Initial call to load devices. Checks for local storage, if none will loads devices. If failing, call setDeviceData directly. 
*/
function awcall(){

  if(localStorage.getItem("devicesData") === null){ 
    console.log("No Data Set, getting data");
    setDeviceData();
  }
  else {
    //getLocalStorage("devicesData");
    ogPicker(); //always set the og list
    console.log("Grabbed From Storage");
  }//end if
 
} //end awcall


/*
  @returns JSON Parsed local Storage Devices Data
*/
function getDeviceData(){
  return getLocalStorage("devicesData");
}
/*
  Sets the Devices data from the All Devices API call. 
*/
function setDeviceData(){
  let headers = loadHeaders();
  let getData = callAPI(server + "/api/mdm/devices/search",headers,"devicesData");
  ogPicker(); //always set the og list
} //end setDeviceData


/*
  Returns the total devices count
*/
function getTotalDeviceCount(id){
  var data = getDeviceData();
  document.getElementById(id).innerHTML = Object.keys(data.Devices).length;
}

/*
  Set the Pick List of Org Groups filtered out of the devices list (only OG's with a device will be shown)
  With help from https://stackoverflow.com/questions/23507853/remove-duplicate-objects-from-json-array
*/
function ogPicker(){

  var data = getDeviceData();
  var str = JSON.stringify(data);

//strip out the LocationGroupId Items
  var gidList = data.Devices.map(function(el) {
        return el.LocationGroupId; //filter the devices on OG's
  });

//get the list of atomic values
  var gidAtomic = {};
  gidList.forEach( function( item ) {
      var grade = gidAtomic[item.Id.Value] = gidAtomic[item.Name] || {};
      grade[item.Name] = true;
  });

//output the list in a way we can read into the dropdown
  var outputList = [];
  for( var gid in gidAtomic ) {
      for( var name in gidAtomic[gid] ) {

        // Get the count of devices for each GID
        var filteredJson = data.Devices.filter(function (row) {
            if(row.LocationGroupId.Id.Value == gid) {
              return true
            } else {
              return false;
            }
          });
        var count = Object.keys(filteredJson).length;

        outputList.push({ GID: gid, Name: name + ': '+count});
      }
  }

//populate dropdown
  let dropdown = document.getElementById('GID');
  dropdown.length = 0;

  let defaultOption = document.createElement('option');
  defaultOption.text = 'Choose Organization Group: Total Devices('+Object.keys(data.Devices).length+')';
  defaultOption.value = '0';

  dropdown.add(defaultOption);
  dropdown.selectedIndex = 0;

//dropdown loop
  let option;
  for (let i = 0; i < outputList.length; i++) {
      option = document.createElement('option');
      option.text = outputList[i].Name;
      option.value = outputList[i].GID;
      dropdown.add(option);
  };

  displayOGDevices(); //call displaying of the OG devics.

}

/*
 @returns value from the Enrollment Status Filter 
*/
function filterEnrollemntStatus(){
  return document.getElementById('enrollStatus').value;
}

/*
  Build out the devices table
*/
function buildDeviceTable(filteredJson){

  //we have a list of devices now. 
  // - Help displaying in a table http://www.encodedna.com/javascript/populate-json-data-to-html-table-using-javascript.htm

   // EXTRACT VALUE FOR HTML HEADER. 
        var col = [];
        for (var i = 0; i < filteredJson.length; i++) {
            for (var key in filteredJson[i]) {
                if (col.indexOf(key) === -1) {
                    col.push(key);
                }
            }
        }

        // CREATE DYNAMIC TABLE.
        var table = document.createElement("table");

        // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

        var tr = table.insertRow(-1);                   // TABLE ROW.

        for (var i = 0; i < col.length; i++) {
            var th = document.createElement("th");      // TABLE HEADER.
            th.innerHTML = col[i];
            tr.appendChild(th);
        }

        // ADD JSON DATA TO THE TABLE AS ROWS.
        for (var i = 0; i < filteredJson.length; i++) {

            tr = table.insertRow(-1);

            for (var j = 0; j < col.length; j++) {
                var tabCell = tr.insertCell(-1);
                //console.log(j);
                if(col[j] == "Id"){ 
                //Id Object Expand
                  var obj = filteredJson[i][col[j]];
                  if(obj.Value !== null){
                    tabCell.innerHTML = obj.Value;
                  }
                }else if(col[j] == "LocationGroupId"){ 
                //LocationGroupId Object Expand
                  var obj = filteredJson[i][col[j]];
                  var obj1 = obj.Id;
                  if(obj1.Value !== null){
                    tabCell.innerHTML = obj1.Value;
                  }
                }else{ 
                //not a target for validation, just print
                  tabCell.innerHTML = filteredJson[i][col[j]];
                }
                
            }
        }

        // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
        var divContainer = document.getElementById("showData");
        divContainer.innerHTML = "";
        divContainer.appendChild(table);
}


/*
  Display Filtered Devices based on OG
*/
function displayOGDevices(){

  var data = getDeviceData();

  if(document.getElementById('GID').value == '0'){
    //buildDeviceTable(data.Devices); //just display all devices if we have not selected an OG. 

if(filterEnrollemntStatus() !== '0'){ //if we have selected anything else than All. 
       var enrollStatus = data.Devices.filter(function (row) {
       //Fiter on OG
        if(filterEnrollemntStatus() == row.EnrollmentStatus) {
          return true
        } else {
          return false;
        }
      }
      );
   }

 //pass filtered data off to build the table
   if(enrollStatus == null){
    buildDeviceTable(data.Devices);
   }else{
    buildDeviceTable(enrollStatus);
   }

  }
  else{
    //Filter based on OG
    var filteredJson = data.Devices.filter(function (row) {
     //Fiter on OG
      if(row.LocationGroupId.Id.Value == document.getElementById('GID').value) {
        return true
      } else {
        return false;
      }
    }
    );

//filter on the Enrollment Status
    if(filterEnrollemntStatus() !== '0'){ //if we have selected anything else than All. 
       var enrollStatus = filteredJson.filter(function (row) {
       //Fiter on OG
        if(filterEnrollemntStatus() == row.EnrollmentStatus) {
          return true
        } else {
          return false;
        }
      }
      );
   }

 //pass filtered data off to build the table
   if(enrollStatus == null){
    buildDeviceTable(filteredJson);
   }else{
    buildDeviceTable(enrollStatus);
   }

  }

  //document.getElementById('out').innerHTML = JSON.stringify(filteredJson); //display raw JSON of devices
  //document.getElementById('out').innerHTML =Object.keys(filteredJson).length;  // display count of devices

}