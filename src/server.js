const http = require("http");
const url = require("url");
const racerDB = require("./racersDB");
const resultDB = require("./resultDB");
const matchDB = require("./matchDB");

const fsp = require("fs/promises");
const { nativeImage } = require("electron");
const { Console } = require("console");

const headerFields = { "Content-Type": "text/html" };

async function createRacer(response, name, id) {
  if (name === undefined) {
    response.writeHead(400, headerFields);
    response.write("<h1>Racer Name Required</h1>");
    response.end();
  } else {
    try {
      await racerDB.saveRacer(name, id);
      response.writeHead(200, headerFields);
      response.write(`<h1>Racer ${name} Created with id ${id}</h1>`);
      response.end();
    } catch (err) {
      response.writeHead(500, headerFields);
      response.write("<h1>Internal Server Error</h1>");
      response.write("<p>Unable to create Racer</p>");
      response.write(`<p>${err}</p>`);
      response.end();
    }
  }
}

async function readRacer(response, id) {
  try {
    const Racer = await racerDB.loadRacer(id);
    let respondText = JSON.stringify(Racer);
    console.log(respondText);
    response.writeHead(200, headerFields);
    response.write(respondText);
    response.end();
  } catch (err) {
    response.writeHead(404, headerFields);
    response.write(`<h1>Racer ${id} Not Found</h1>`);
    response.end();
  }
}

async function updateRacer(response, name) {
  try {
    const Racer = await racerDB.loadRacer(name);
    console.log(Racer.name);
    await racerDB.modifyRacer(Racer);
    response.writeHead(200, headerFields);
    response.write(`<h1>Racer ${Racer._id} Updated</h1>`);
    response.end();
  } catch (err) {
    response.writeHead(404, headerFields);
    response.write(`<h1>Racer ${name} Not Found</h1>`);
    response.end();
  }
}

async function deleteRacer(response, id) {
  try {
    const Racer = await racerDB.loadRacer(id);
    racerDB.removeRacer(Racer);
    response.writeHead(200, headerFields);
    response.write(`Racer ID ${Racer._id} Deleted`);
    response.end();
  } catch (err) {
    response.writeHead(404, headerFields);
    response.write(`Racer ID ${id} Not Found`);
    response.end();
  }
}

async function dumpRacers(response) {
  try {
    const racers = await racerDB.loadAllRacers();

    let responseText = "";
    racers.forEach((racer) => {
      responseText += `${racer._id} ${racer.name};`;
    });

    response.writeHead(200, headerFields);
    response.write(responseText);
    response.end();
  } catch (err) {
    response.writeHead(500, headerFields);
    response.write("<h1>Internal Server Error</h1>");
    response.write("<p>In dumpRacers</p>");
    response.write(`<pre>${err}</pre>`);
    response.end();
  }
}
// ----------------Actions depending on race results --------
function populateScore(pair, time1, time2) {
  let Score1 = pair[0].Score;
  let Score2 = pair[1].Score;
  let done = false;
  console.log(time1);
  if (parseInt(Score1) !== 0 || parseInt(Score2) !== 0) {
    done = true;
    // pair[0].Second = `${Math.floor(time1/1000/60)}:${Math.floor(time1/1000)%60}:${time1%1000}`
    // pair[1].Second = `${Math.floor(time2/1000/60)}:${Math.floor(time2/1000)%60}:${time2%1000}`
    pair[0].Second = parseInt(time1);
    pair[1].Second = parseInt(time2);
  } else {
    // pair[0].First = `${Math.floor(time1/1000/60)}:${Math.floor(time1/1000)%60}:${time1%1000}`
    // pair[1].First = `${Math.floor(time2/1000/60)}:${Math.floor(time2/1000)%60}:${time2%1000}`
    pair[0].First = parseInt(time1);
    pair[1].First = parseInt(time2);
  }
  Score1 += parseInt(time1);
  Score2 += parseInt(time2);
  pair[0].Score = Score1;
  pair[1].Score = Score2;
  if (done) {
    if (Score1 < Score2) {
      pair[0].winner = true;
      pair[1].winner = false;
      return pair[0].RacerID;
    } else {
      pair[1].winner = true;
      pair[0].winner = false;
      return pair[1].RacerID;
    }
  }
  return null;
}
async function updateRace(response, raceID, AID, BID, ATime, BTime) {
  try {
    //add race reult to matchDB
    let doc = await matchDB.loadAllMatches(); // all result
    // console.log(doc)
    let modified = 0;
    for (let i = 0; i < doc.length; i++) {
      let curRound = doc[i]; //curRound{finished, winner[],Matches[]}
      if (!curRound.finished) {
        modified = i;
        let matches = curRound.matches;
        for (let j = 0; j < matches.length; j++) {
          let curMatch = matches[j]; //curMatch{done,pair[{},{}]}
          if (!curMatch.done) {
            let curPair = curMatch.pair;

            console.log(curMatch.races);
            let winner = null;

            if (curPair[0].RacerID === AID && curPair[1].RacerID === BID) {
              winner = populateScore(curPair, ATime, BTime);
              curMatch.pair[2].races.push(raceID);
            } else if (
              curPair[1].RacerID === AID &&
              curPair[0].RacerID === BID
            ) {
              winner = populateScore(curPair, BTime, ATime);
              curMatch.pair[2].races.push(raceID);
            }
            if (curPair[1].RacerID === "BYE") {
              winner = curPair[0].RacerID;
              curPair[0].winner = true;
            }
            console.log("finish populating");
            console.log(curPair);
            if (winner !== null) {
              curMatch.done = true;
              curRound.winners[Math.floor(j / 2)].push(winner);
            }
            console.log("finish appending winner");
          }
        }
        curRound.finished = true;
        curRound.winners.forEach((nextPair) => {
          if (nextPair.length !== 2) {
            curRound.finished = false;
          }
        });
        if (curRound.finished) {
          console.log(curRound.winners);
          console.log("generate next round");
          if (i + 1 < doc.length) {
            let nextRound = doc[i + 1];
            for (let w = 0; w < curRound.winners.length; w++) {
              nextRound.matches[w].pair[0].RacerID = curRound.winners[w][0];
              nextRound.matches[w].pair[1].RacerID = curRound.winners[w][1];
            }
            await matchDB.modifyRound(doc[i + 1]);
          }
        }
        break;
      }
    }
    console.log(doc);
    await matchDB.modifyRound(doc[modified]);
    //add raceID to racerDB
    const racerA = await racerDB.loadRacer(AID);
    const racerB = await racerDB.loadRacer(BID);
    console.log(racerA);
    racerA.raceIDs.push(raceID);
    racerB.raceIDs.push(raceID);
    await racerDB.modifyRacer(racerA);
    await racerDB.modifyRacer(racerB);

    //add race result to resultDB
    await resultDB.saveResult(raceID, AID, BID, ATime, BTime);

    let responseText = "Racer and Result Table updated";
    response.writeHead(200, headerFields);
    response.write(responseText);
    response.end();
  } catch (err) {
    response.writeHead(500, headerFields);
    response.write("<h1>Internal Server Error</h1>");
    response.write("<p>In updateRace</p>");
    response.write(`<pre>${err}</pre>`);
    response.end();
  }
}
function recheckWinner(pair) {
  let Score1 = pair[0].Score;
  let Score2 = pair[1].Score;

  if (Score1 < Score2 || Score2 === -1) {
    if (Score1 === -1) {
      pair[1].winner = true;
      pair[0].winner = false;
      return [pair[1].RacerID, pair[0].RacerID];
    }
    pair[0].winner = true;
    pair[1].winner = false;
    console.log(`${pair[0].RacerID}, ${pair[1].RacerID}`);
    return [pair[0].RacerID, pair[1].RacerID];
  } else {
    pair[1].winner = true;
    pair[0].winner = false;
    return [pair[1].RacerID, pair[0].RacerID];
  }
}
async function changeMatch(response, raceID, racerID) {
  try {
    //add race reult to matchDB
    let doc = await matchDB.loadAllMatches(); // all result
    console.log("change match");
    let modified = 0;
    for (let i = 0; i < doc.length; i++) {
      let curRound = doc[i]; //curRound{finished, winner[],Matches[]}
      modified = i;
      let b = false;
      for (let j = 0; j < curRound.matches.length; j++) {
        console.log("in j:");
        let curMatch = curRound.matches[j];
        let order = curMatch.pair[2].races.findIndex(
          (element) => element == raceID
        );
        console.log(`order: ${order}`);
        console.log(`compare ${curMatch.pair[0].RacerID} with ${String(racerID)}`)
        let racer = curMatch.pair[0].RacerID === String(racerID) ? 0 : 1;
        console.log(`result is ${racer}`)
        console.log(`curent racer ${racer}`);

        if (order !== -1) {
          if (order === 0) {
            curMatch.pair[racer].First =
              parseInt(curMatch.pair[racer].First) + 1000;
            curMatch.pair[racer].Score += 1000;
          } else if (order === 1) {
            curMatch.pair[racer].Second +=
              parseInt(curMatch.pair[racer].Second) + 1000;
            curMatch.pair[racer].Score += 1000;
          }

          if (curMatch.done) {
            let [winner, looser] = recheckWinner(curMatch.pair);
            console.log(`winner ${winner} loose ${looser}`);
            let idx = curRound.winners[Math.floor(j / 2)].findIndex(
              (element) => element == looser
            );
            if (idx > -1) {
              console.log(
                `before change ${curRound.winners[Math.floor(j / 2)]}`
              );

              curRound.winners[Math.floor(j / 2)][idx] = winner;
              console.log(
                `after change ${curRound.winners[Math.floor(j / 2)]}`
              );
            }
            if (curRound.finished) {
              // console.log(curRound.winners);

              if (i + 1 < doc.length) {
                let nextRound = doc[i + 1];

                for (let w = 0; w < curRound.winners.length; w++) {
                  console.log(`cur winner ${curRound.winners[w]}`);
                  nextRound.matches[w].pair[0].RacerID = curRound.winners[w][0];
                  nextRound.matches[w].pair[1].RacerID = curRound.winners[w][1];
                }
                console.log(`in next round ${nextRound}`);
                await matchDB.modifyRound(doc[i + 1]);
              }
            }
            b = true;

            break;
          }
        }
      }
      if (b) {
        break;
      }
    }
    // console.log("modify round");
    await matchDB.modifyRound(doc[modified]);

    //add race result to resultDB
    let old = await resultDB.loadResult(raceID);
    if (String(racerID) === old.TrackA) {
      old.TimeA = parseInt(old.TimeA) + 1000;
    } else {
      old.TimeB = parseInt(old.TimeB) + 1000;
    }
    console.log(old);
    await resultDB.modifyRace(old);

    let responseText = `One Second penalty applied for racerID ${racerID}`;
    response.writeHead(200, headerFields);
    response.write(responseText);
    response.end();
  } catch (err) {
    response.writeHead(500, headerFields);
    response.write("<h1>Internal Server Error</h1>");
    response.write("<p>In changeMatch</p>");
    response.write(`<pre>${err}</pre>`);
    response.end();
    // console.log(err)
  }
}

async function voidMatch(response, raceID, racerID) {
  try {
    //add race reult to matchDB
    let doc = await matchDB.loadAllMatches(); // all result
    console.log("void match");
    let modified = 0;
    for (let i = 0; i < doc.length; i++) {
      let curRound = doc[i]; //curRound{finished, winner[],Matches[]}
      modified = i;
      let b = false;
      for (let j = 0; j < curRound.matches.length; j++) {
        console.log("in j:");
        let curMatch = curRound.matches[j];
        let order = curMatch.pair[2].races.findIndex(
          (element) => element == raceID
        );
        console.log(`order: ${order}`);
        let racer = curMatch.pair[0].RacerID === String(racerID) ? 0 : 1;
        console.log(`curent racer ${racer}`);

        if (order !== -1) {
          curMatch.pair[racer].Score = -1;

          if (curMatch.done) {
            let [winner, looser] = recheckWinner(curMatch.pair);
            console.log(`winner ${winner} loose ${looser}`);
            let idx = curRound.winners[Math.floor(j / 2)].findIndex(
              (element) => element == looser
            );
            if (idx > -1) {
              curRound.winners[Math.floor(j / 2)][idx] = winner;
            }
            if (curRound.finished) {
              // console.log(curRound.winners);

              if (i + 1 < doc.length) {
                let nextRound = doc[i + 1];

                for (let w = 0; w < curRound.winners.length; w++) {
                  console.log(`cur winner ${curRound.winners[w]}`);
                  nextRound.matches[w].pair[0].RacerID = curRound.winners[w][0];
                  nextRound.matches[w].pair[1].RacerID = curRound.winners[w][1];
                }
                console.log(`in next round ${nextRound}`);
                await matchDB.modifyRound(doc[i + 1]);
              }
            }
            b = true;

            break;
          }
        }
      }
      if (b) {
        break;
      }
    }
    // console.log("modify round");
    await matchDB.modifyRound(doc[modified]);

    //add race result to resultDB
    let old = await resultDB.loadResult(raceID);
    if (String(racerID) === old.TrackA) {
      old.TimeA = -1;
    } else {
      old.TimeB = -1;
    }
    console.log(old);
    await resultDB.modifyRace(old);

    let responseText = `Disqualification applied for racerID ${racerID}`;
    response.writeHead(200, headerFields);
    response.write(responseText);
    response.end();
  } catch (err) {
    response.writeHead(500, headerFields);
    response.write("Internal Server Error");
    response.write("In voidMatch");
    response.write(`${err}`);
    response.end();
    // console.log(err)
  }
}

async function getRacerResult(response, Raceid) {
  try {
    const Race = await resultDB.loadResult(Raceid);
    let respondText = JSON.stringify(Race);
    console.log(respondText);
    response.writeHead(200, headerFields);
    response.write(respondText);
    response.end();
  } catch (err) {
    response.writeHead(404, headerFields);
    response.write(`<h1>Race ${Raceid} Not Found</h1>`);
    response.end();
  }
}

async function dumpResults(response) {
  try {
    const results = await resultDB.loadAllResults();
    let responseText = JSON.stringify(results);

    response.writeHead(200, headerFields);
    response.write(responseText);
    response.end();
  } catch (err) {
    response.writeHead(500, headerFields);
    response.write("<h1>Internal Server Error</h1>");
    response.write("<p>In dumpResults</p>");
    response.write(`<pre>${err}</pre>`);
    response.end();
  }
}
//-------------Actions relevant to bracket
async function MatchDBInit(response, participants) {
  try {
    let base = Math.ceil(Math.log2(participants)) - 1;
    let brackets = Math.pow(2, base);
    let round = 1;
    let RacerID1 = 1;
    let RacerID2 = brackets + 1;

    while (brackets >= 2) {
      let size = Math.floor(brackets / 2);
      console.log(brackets);
      console.log(size);
      let doc = {
        _id: String(round),
        finished: false,
        winners: Array(size).fill([]),
        matches: [],
      };
      if (round > 1) {
        RacerID1 = "";
        RacerID2 = "";
      }
      for (let j = 0; j < brackets; j++) {
        doc.matches.push({
          done: false,
          pair: [
            {
              RacerID: String(RacerID1),
              Score: 0,
              winner: false,
              First: 0,
              Second: 0,
            },
            {
              RacerID: String(RacerID2),
              Score: 0,
              winner: false,
              First: 0,
              Second: 0,
            },
            {
              races: [],
            },
          ],
        });

        if (typeof RacerID1 === "number") {
          RacerID1 = RacerID1 + 1 > participants ? "BYE" : RacerID1 + 1;
        }
        if (typeof RacerID2 === "number") {
          RacerID2 = RacerID2 + 1 > participants ? "BYE" : RacerID2 + 1;
        }
      }
      await matchDB.MatchInit(doc);
      console.log(doc);
      round++;
      brackets = size; // Update brackets correctly
    }
    if (brackets === 1) {
      let doc = {
        _id: String(round),
        finished: false,
        winners: Array(1).fill([]), //might be a problem
        matches: [
          {
            done: false,
            pair: [
              {
                RacerID: "",
                Score: 0,
                winner: false,
                First: 0,
                Second: 0,
              },
              {
                RacerID: "",
                Score: 0,
                winner: false,
                First: 0,
                Second: 0,
              },
              {
                races: [],
              },
            ],
          },
        ],
      };
      await matchDB.MatchInit(doc);
      console.log(doc);
    }

    console.log("matchDB initialized");

    response.writeHead(200, headerFields);
    response.write("Match database initialized");
    response.end();
  } catch (err) {
    response.writeHead(500, headerFields);
    response.write("Competition already started!");
    response.write("Additional changes will not be accepted.");
    response.end();
  }
}

async function dumpMatches(response) {
  try {
    const Race = await matchDB.loadAllMatches();
    let respondText = JSON.stringify(Race);
    // console.log(respondText)
    response.writeHead(200, headerFields);
    response.write(respondText);
    response.end();
  } catch (err) {
    response.writeHead(404, headerFields);
    response.write(`<h1>Race ${id} Not Found</h1>`);
    response.end();
  }
}

async function deleteEverything(response) {
  try {
    await matchDB.deleteAllMatches();
    let respondText = "All matches deleted\n";
    await racerDB.deleteAllRacers();
    respondText += "All racers deleted \n";
    await resultDB.deleteAllResults();
    respondText += "All results deleted \n";
    response.writeHead(200, headerFields);
    response.write(respondText);
    response.end();
  } catch (err) {
    response.writeHead(404, headerFields);
    response.write(`<h1>Race ${err} Not Found</h1>`);
    response.end();
  }
}

async function basicServer(request, response) {
  const options = url.parse(request.url, true).query;

  // Check if the request method and path are equal to the given method and path
  const isEqual = (method, path) =>
    request.method === method && request.url === path;

  // Match the request method and path
  const isMatch = (method, path) =>
    request.method === method && request.url.startsWith(path);

  // Check if the request URL ends with a specific suffix
  const hasSuffix = (suffix) =>
    request.method === "GET" && request.url.endsWith(suffix);

  // Get the suffix of the request URL
  const getSuffix = (urlpath = request.url) => {
    const parts = urlpath.split(".");
    return parts[parts.length - 1];
  };

  // Get the content type based on the file type
  const getContentType = (urlpath = request.url) =>
    ({
      html: "text/html",
      css: "text/css",
      js: "text/javascript",
    }[getSuffix(urlpath)] || "text/plain");

  const sendStaticFile = async (urlpath = request.url) => {
    try {
      // Read the file from the src/client folder and send it back to the client
      const data = await fsp.readFile("src" + urlpath, "utf8");
      response.writeHead(200, { "Content-Type": getContentType(urlpath) });
      response.write(data);
      response.end();
      return;
    } catch (err) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.write("Not found: " + urlpath);
      response.end();
      return;
    }
  };

  if (isMatch("GET", "/read")) {
    await readRacer(response, options.ID);
    return;
  }
  if (isMatch("GET", "/getResult")) {
    await getRacerResult(response, options.RaceID);
    return;
  }

  if (isMatch("POST", "/create")) {
    await createRacer(response, options.name, options.ID);
    return;
  }
  if (isMatch("POST", "/update")) {
    //update?Race_ID=9&A_ID=8&B_ID=54&A_Time=7477&B_Time=8848
    await updateRace(
      response,
      options.Race_ID,
      options.A_ID,
      options.B_ID,
      options.A_Time,
      options.B_Time
    );
    return;
  }
  if (isMatch("PUT", "/update")) {
    await updateRacer(response, options.name);
    return;
  }
  if (isMatch("DELETE", "/deleteAll")) {
    await deleteEverything(response);
    return;
  }
  if (isMatch("DELETE", "/delete")) {
    await deleteRacer(response, options.ID);
    return;
  }

  if (isMatch("GET", "/all")) {
    await dumpRacers(response);
    return;
  }
  if (isMatch("GET", "/Results")) {
    await dumpResults(response);
    return;
  }
  if (isMatch("POST", "/Init")) {
    await MatchDBInit(response, options.participants);
    return;
  }
  if (isMatch("GET", "/Matches")) {
    await dumpMatches(response);
    return;
  }
  if (isMatch("POST", "/penalty")) {
    await changeMatch(response, options.RaceID, options.RacerID);
    return;
  }
  if (isMatch("POST", "/disqual")) {
    await voidMatch(response, options.RaceID, options.RacerID);
    return;
  }

  if (
    isEqual("GET", "") ||
    isEqual("GET", "/") ||
    isEqual("GET", "/client") ||
    isEqual("GET", "/client/") ||
    isEqual("GET", "/client/index.html")
  ) {
    sendStaticFile("/client/index.html");
    return;
  }

  if (
    (isMatch("GET", "") || isMatch("GET", "/")) &&
    (hasSuffix(".html") || hasSuffix(".css") || hasSuffix(".js"))
  ) {
    sendStaticFile("/" + request.url);
    return;
  }

  response.writeHead(405, { "Content-Type": "text/plain" });
  response.write("Method Not Allowed");
  response.end();
}

http.createServer(basicServer).listen(3260, () => {
  console.log("Server started on port 3260");
});
