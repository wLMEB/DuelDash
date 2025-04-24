const rows = document.getElementById("tableBody");
const bracketContainer = document.getElementById("bracket-container");
let isFirstLoad = true;
const URL = "http://localhost:3260";
document.addEventListener("DOMContentLoaded", () => {
  if (isFirstLoad) {
    console.log("DOM loaded for the first time");
    // let last = getResults()
    // getRecent(last);
    getResults();
    getGraphData();
    isFirstLoad = false; // Set the flag to false after the first load
  }
});

async function getResults() {
  let response = await fetch(`${URL}/Results`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let data = await response.json();
  let latestID = 0;
  data.forEach((result) => {
    //   const row = document.createElement("tr");
    //   row.innerHTML = `
    //   <td>${result._id}</td>
    //   <td>${result.TrackA}</td>
    //   <td>${result.TrackB}</td>
    //   <td>${result.TimeA}</td>
    //   <td>${result.TimeB}</td>

    // `;
    latestID =
      parseInt(result._id) > latestID ? parseInt(result._id) : latestID;
    // rows.insertBefore(row, rows.firstChild);
  });
  // return latestID;
  getRecent(latestID);
}

async function getRecent(latestID) {
  const recentResult = document.createElement("div");
  if (latestID === 0) {
    recentResult.innerHTML = `<h4>No Race has happened yet.</h4>`;
  } else {
    let response = await fetch(`${URL}/getResult?RaceID=${latestID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    let data = await response.json();

    let timeB = `${Math.floor(data.TimeB / 1000 / 60)}:${
      Math.floor(data.TimeB / 1000) % 60
    }:${data.TimeB % 1000}`;
    let timeA = `${Math.floor(data.TimeA / 1000 / 60)}:${
      Math.floor(data.TimeA / 1000) % 60
    }:${data.TimeA % 1000}`;

    recentResult.innerHTML = `<h4>Race #${data._id}  TrackA:${data.TrackA}  TimeA:${timeA}  TrackB:${data.TrackB}  TimeB:${timeB}</h4>`;
  }
  document.getElementById("Recent").appendChild(recentResult);
}

async function getGraphData() {
  let response = await fetch(`${URL}/Matches`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  let data = await response.json();
  // console.log(data);
  data.forEach((round) => {
    bracketContainer.appendChild(createRoundElement(round));
  });
}

function createMatchElement(match) {
  const matchElement = document.createElement("div");
  matchElement.className = "tournament-bracket__match";
  matchElement.tabIndex = 0;

  const table = document.createElement("table");
  table.className = "tournament-bracket__table";

  const thead = document.createElement("thead");
  thead.className = "sr-only";
  thead.innerHTML = `
          <tr>
              <th>ID</th>
              <th>Score</th>
              <th>Round 1</th>
              <th>Round 2</th>
          </tr>
      `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tbody.className = "tournament-bracket__content";
  const des = document.createElement("tr");
  des.innerHTML = `
  <td class="tournament-bracket__score">
   <abbr class="tournament-bracket__tag " >First </abbr></td>
      <td class="tournament-bracket__score">
   <abbr class="tournament-bracket__tag" >Second </abbr></td>
   <td class="tournament-bracket__score">
   <abbr class="tournament-bracket__tag" >Final  </abbr></td>
   <td class="tournament-bracket__score">
   <abbr class="tournament-bracket__tag" >Racers  </abbr></td>`;
  tbody.appendChild(des);

  for (let i = 0; i < 2; i++) {
    let racer = match.pair[i];
    const tr = document.createElement("tr");
    tr.className = `tournament-bracket__team ${
      racer.winner ? "tournament-bracket__team--winner" : ""
    }`;
    console.log(racer);
    let time1 = parseInt(racer.First);
    let Time1 = `${Math.floor(time1 / 1000 / 60)}:${
      Math.floor(time1 / 1000) % 60
    }:${time1 % 1000}`;
    let time2 = parseInt(racer.Second);
    let Time2 = `${Math.floor(time2 / 1000 / 60)}:${
      Math.floor(time2 / 1000) % 60
    }:${time2 % 1000}`;
    tr.innerHTML = `
              <td class="tournament-bracket__country">
                  <abbr class="tournament-bracket__code" >${racer.RacerID}</abbr>
              </td>
              <td class="tournament-bracket__score">
                  <span class="tournament-bracket__number">${racer.Score}</span>
              </td>
              
              <td class="tournament-bracket__2">
                  <span class="tournament-bracket__number">${Time2}</span>
                  </td>
              <td class="tournament-bracket__1">  
                  <span class="tournament-bracket__number">${Time1}</span>
                  </td>
          `;
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  matchElement.appendChild(table);

  return matchElement;
}

function createRoundElement(round) {
  const roundElement = document.createElement("div");
  roundElement.className = `tournament-bracket__round tournament-bracket__round--${round._id}`;

  const title = document.createElement("h3");
  title.className = "tournament-bracket__round-title";
  title.textContent = `Round ${round._id}`;
  roundElement.appendChild(title);

  const list = document.createElement("ul");
  list.className = "tournament-bracket__list";

  round.matches.forEach((match) => {
    const item = document.createElement("li");
    item.className = "tournament-bracket__item";
    item.appendChild(createMatchElement(match));
    list.appendChild(item);
  });

  roundElement.appendChild(list);
  return roundElement;
}

[
  // {
  //   id: 1,
  //   matches: [
  //     {
  //       pair: [
  //         {
  //           RacerID, Score, winner, First, Second
  //         },
  //         {
  //           RacerID, Score, winner, First, Second
  //         }
  //       ],
  //     },
  //     {
  //       pair: [
  //         {
  //           RacerID, Score, winner,First, Second
  //         },
  //         {
  //           RacerID, Score, winner,First, Second
  //         }
  //       ],
  //     },
  //   ],
  // },
];
