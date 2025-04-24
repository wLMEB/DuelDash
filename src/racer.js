const content = document.getElementById("views");
const URL = "http://localhost:3260";
import { render as landingRender } from "./landing.js";

let RACERID = "";

async function render(racerID, racerName) {
  // Render function called by other pages to render this page
  console.log("in RACER render");
  content.innerHTML = "";
  RACERID = racerID;

  // Create a container div
  const container = document.createElement("div");
  container.className = "raceTables";
  const backButton = document.createElement("button");
  backButton.addEventListener("click", () => landingRender());
  backButton.className = "back-button";
  backButton.textContent = "Back";
  container.appendChild(backButton);

  const NameContainer = document.createElement("div");
  NameContainer.classList = "Name";
  NameContainer.innerHTML = `RacerName:<strong> ${racerName}</strong>    RacerID:<strong> ${racerID}</strong>`;
  container.appendChild(NameContainer);

  // Create a table element
  const table = document.createElement("table");
  table.id = "raceTable";
  // Create the table header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const headers = ["Race ID", "Time Used", "Opponent", "Action"];
  headers.forEach((headerText) => {
    const th = document.createElement("th");
    th.textContent = headerText;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create the table body
  const tbody = document.createElement("tbody");
  tbody.className = "data";

  // Fetch and populate data
  const data = await getRacerData(racerID);
  const raceIDs = data.raceIDs;
  console.log(raceIDs);
  if (raceIDs.length !== 0) {
    for (const raceID of raceIDs) {
      await buildTable(raceID, tbody);
    }
  }

  table.appendChild(tbody);
  container.appendChild(table);
  content.appendChild(container);
}

async function getRacerData(racerID) {
  let response = await fetch(`${URL}/read?ID=${racerID}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.json();
  return data;
}

async function buildTable(raceID, tbody) {
  let response = await fetch(`${URL}/getResult?RaceID=${raceID}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.json();
  console.log(data);
  const A = data.TrackA;
  const B = data.TrackB;
  let timeB = `${Math.floor(data.TimeB / 1000 / 60)}:${
    Math.floor(data.TimeB / 1000) % 60
  }:${data.TimeB % 1000}`;
  let timeA = `${Math.floor(data.TimeA / 1000 / 60)}:${
    Math.floor(data.TimeA / 1000) % 60
  }:${data.TimeA % 1000}`;

  let oppo, time;

  if (data.TrackA !== RACERID) {
    oppo = A;
    time = timeB;
  } else {
    oppo = B;
    time = timeA;
  }

  const row = document.createElement("tr");

  const name = document.createElement("td");
  name.textContent = `${raceID}`;
  const timer = document.createElement("td");
  timer.textContent = `${time}`;
  const oppor = document.createElement("td");
  oppor.textContent = `${oppo}`;
  const btnField = document.createElement("td");
  row.appendChild(name);

  row.appendChild(timer);

  row.appendChild(oppor);
  row.appendChild(btnField);

  tbody.appendChild(row);

  const penaltyBtn = document.createElement("button");
  penaltyBtn.className = "penal-button";
  penaltyBtn.setAttribute("data-id", raceID);
  penaltyBtn.id = `penalty${raceID}`;
  penaltyBtn.textContent = "Add Penalty";
  penaltyBtn.addEventListener("click", () => {
    addPenalty(raceID, RACERID);
  });

  const disqualBtn = document.createElement("button");
  disqualBtn.className = "dis-button";
  disqualBtn.setAttribute("data-id", raceID);
  disqualBtn.id = `disqual${raceID}`;
  disqualBtn.textContent = "Disqualify";
  disqualBtn.addEventListener("click", () => {
    disqualify(raceID, RACERID);
  });
  btnField.appendChild(penaltyBtn);
  btnField.appendChild(disqualBtn);
}

async function addPenalty(raceID, racerID) {
  console.log(`racer${racerID} with race${raceID} add penalty`);
  let response = await fetch(`${URL}/penalty?RaceID=${raceID}&RacerID=${racerID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.text();
  window.alert(data)
}

async function disqualify(raceID, racerID) {
  console.log(`racer${racerID} with race${raceID} disqualify`);
  let response = await fetch(`${URL}/disqual?RaceID=${raceID}&RacerID=${racerID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.text();
  window.alert(data)
}

export { render };
