import { render as racerRender } from "./racer.js";
const URL = "http://localhost:3260"; // URL of our server
let usedID;
const content = document.getElementById("views");

function render() {
  //render function called by other pages to render this page
  console.log("in landing render");
  content.innerHTML = "";

  const leftDiv = document.createElement("div");
  leftDiv.className = "left";

  const compName = document.createElement("div");
  compName.innerHTML = "<h1>Dual Dash System</h1><h4>To enter names for participants, type in a comma separated list of names in the text box below. You can also choose a file that contain those names.</h4>"
  compName.id = "CompName";
  leftDiv.appendChild(compName);

  const textArea = document.createElement("textarea");
  textArea.id = "textInput";

  textArea.placeholder = "Enter comma-separated values";
  leftDiv.appendChild(textArea);

  const submitButton = document.createElement("button");
  submitButton.type = "button";
  submitButton.id = "Submit";
  submitButton.textContent = "Submit";
  submitButton.addEventListener("click", processText);
  leftDiv.appendChild(submitButton);

  leftDiv.appendChild(document.createElement("br"));
  leftDiv.appendChild(document.createElement("br"));

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "fileInput";
  fileInput.addEventListener("change", processFile);
  leftDiv.appendChild(fileInput);

  content.appendChild(leftDiv);

  const rightDiv = document.createElement("div");
  rightDiv.className = "right";
  
  const direction = document.createElement("div");
  direction.innerHTML = "<h2>Racers</h2><h4>Racers currently in the system will be displayed below. Click on racer will show their match details. Refresh if experiences. </h4>"
  rightDiv.appendChild(direction)
  const statusDiv = document.createElement("div");
  statusDiv.id = "Status";
  rightDiv.appendChild(statusDiv);



  const deleteDiv = document.createElement("div");
  deleteDiv.className = "mass-delete";
  const delIDInput = document.createElement("input");
  delIDInput.type = "text";
    delIDInput.id = "DelID";
  delIDInput.cols = 30;
  delIDInput.rows = 30;
  delIDInput.placeholder = "Enter to be deleted RacerIDs separated by commas, eg: 1,2,3"

  deleteDiv.appendChild(delIDInput);
  rightDiv.appendChild(deleteDiv);

  const displayDiv = document.createElement("div");
  displayDiv.id = "display";
  rightDiv.appendChild(displayDiv);

  const deleteButton = document.createElement("button");
  deleteButton.id = "deleteBtn";
  deleteButton.textContent = "Delete Multiple ID";
  deleteButton.addEventListener("click", removeSelectedRacer);
  deleteDiv.appendChild(deleteButton);

  

  content.appendChild(rightDiv);

  const startButton = document.createElement("button");
  startButton.id = "startBtn";
  startButton.textContent = "Start competition";
  startButton.addEventListener("click", BracketInit);

  const newButton = document.createElement("button");
  newButton.id = "newBtn";
  newButton.textContent="New competition"
  newButton.addEventListener("click", ()=>deleteAll())
  const compAction = document.createElement("div")
  compAction.className = "comp-button"
  compAction.appendChild(startButton);
  compAction.appendChild(newButton);
  
  rightDiv.appendChild(compAction);
  

  // Call viewAll after the DOM is fully loaded and elements are created
  viewAll();
}


async function NewName(Name, ID) {
  console.log(`${Name}, ${ID}`);
  let response = await fetch(`${URL}/create?name=${Name}&ID=${ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.text();
  document.getElementById("Status").innerHTML = data;
}

async function BracketInit() {
  console.log(usedID.size)
  let response = await fetch(`${URL}/Init?participants=${usedID.size}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.text();
  window.alert(data);

  let startButton = document.getElementById("startBtn")
  startButton.removeEventListener("click",BracketInit)
  startButton.textContent = "Competition Started!"
}
async function deleteAll(){
  let response = await fetch(`${URL}/deleteAll`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.text();
  window.alert(data);
  
}
async function deleteName(ID) {
  let response = await fetch(`${URL}/delete?ID=${ID}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.text();
  window.alert(data);
}

async function viewAll() {
  let response = await fetch(`${URL}/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.text();
  // document.getElementById("display").innerHTML = data;

  usedID = new Set();
  let curentIDs = extractNumbersFromHTML(data);

  curentIDs.forEach((pair) => {
    console.log(pair);
    if (pair[0] !== "") {
      usedID.add(pair[0]);
    }
  });

  buildTable(curentIDs);
}
function buildTable(data) {
  const tableContainer = document.getElementById("display"); // Ensure a div with this ID exists

  // Create table elements
  const table = document.createElement("table");
  table.id = "dataTable";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.id = "tableHeader";

  ["Name", "ID", "Action"].forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create tbody
  const tbody = document.createElement("tbody");
  tbody.id = "tableBody";

  data.forEach((racer) => {
    if (racer[0] !== "") {
      const row = document.createElement("tr");

      // Name column with button
      const nameCell = document.createElement("td");
      const nameButton = document.createElement("button");
      nameButton.id = `name${racer[0]}`;
      nameButton.className = "button-name";
      nameButton.textContent = racer[1];
      nameButton.onclick = () => racerRender(racer[0], racer[1]);
      nameCell.appendChild(nameButton);
      row.appendChild(nameCell);

      // ID column
      const idCell = document.createElement("td");
      idCell.innerHTML = `<strong>${racer[0]}</strong>`;
      row.appendChild(idCell);

      // Action column with Delete and Edit buttons
      const actionCell = document.createElement("td");

      const delButton = document.createElement("button");
      delButton.id = `Del${racer[0]}`;
      delButton.className = "button-delete";
      delButton.textContent = "Delete";
      delButton.onclick = () => {deleteName(racer[0]); viewAll()};

      const editButton = document.createElement("button");
      editButton.id = `Edit${racer[0]}`;
      editButton.className = "button-edit";
      editButton.textContent = "Edit";
      editButton.onclick = () => editRacer(racer[0]);

      actionCell.appendChild(delButton);
      actionCell.appendChild(editButton);
      row.appendChild(actionCell);

      tbody.appendChild(row);
    }
  });

  table.appendChild(tbody);

  // Clear previous table and append new one
  tableContainer.innerHTML = "";
  tableContainer.appendChild(table);
}
function extractNumbersFromHTML(htmlString) {
  let info = htmlString.split(";");

  let IDs = [];
  for (let i = 0; i < info.length; i++) {
    let index = info[i].indexOf(" ");
    let part1 = info[i].substring(0, index);
    let part2 = info[i].substring(index + 1);
    IDs.push([part1, part2]);
  }

  IDs.sort((a, b) => a[0] - b[0]);

  return IDs;
}

function removeSelectedRacer() {
  const racerDeleteID = document.getElementById("DelID");
  console.log(`deleting ${racerDeleteID.value}`);
  let input = racerDeleteID.value;
  let data = input.split(",");
  console.log(input);
  data.forEach((id) => {
    deleteName(id);
  });

  racerDeleteID.value = "";
  viewAll();
}

function processText() {
  let input = document.getElementById("textInput").value;
  let data = input.split(",");
  let nextID = 1;
  for (let i = 0; i < data.length; i++) {
    if (data[i].trim().length === 0) {
      continue; // Skip empty strings
    }
    while (usedID.has(nextID.toString())) {
      nextID++;
    }

    NewName(data[i].trim(), nextID);
    usedID.add(nextID.toString());
  }
  viewAll();
  document.getElementById("textInput").value = "";
}

function processFile(event) {
  let file = event.target.files[0];
  if (!file) return;

  let reader = new FileReader();
  reader.onload = function (e) {
    let rows = e.target.result
      .split("\n")
      .map((row) => row.split(",").map((cell) => cell.trim()));
    let nextID = 1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0].length === 0) {
        continue; // Skip empty strings
      }
      while (usedID.has(nextID.toString())) {
        nextID++;
      }

      NewName(rows[i][0], nextID);
      usedID.add(nextID.toString());
    }
    viewAll();
  };
  reader.readAsText(file);
}

export { render };
