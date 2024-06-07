const readline = require('node:readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Input Token: `, TELEGRAM_USER => {

  let ACCESS_TOKEN = TELEGRAM_USER.replace(/"/g, '');

  let listColect = [];
  let listDuck = [];
  let countEgg = 0;

  Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
  };

  async function getTotalEgg() {
    try {
      let response = await fetch("https://api.quackquack.games/balance/get", {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,vi;q=0.8",
          authorization: "Bearer " + ACCESS_TOKEN,
        },
        body: null,
        method: "GET",
      });
      let data = await response.json();

      if (data.error_code !== "") console.log(data.error_code);

      console.log(`---------------------------`);
      data.data.data.map((item) => {
        if (item.symbol === "PET") console.log(`    Total Pepe: ${Number(item.balance)} 🐸`)
        if (item.symbol === "EGG") {
          console.log(`    Total Egg: ${parseInt(item.balance)} 🥚`);
          console.log(`   Eggs Collected: ${countEgg} 🥚`);
        }
      });
      console.log(`---------------------------`);
      getListCollectEgg();
    } catch (error) {
      setTimeout(getTotalEgg, 1e3);
    }
  }

  async function getListCollectEgg() {
    try {
      listColect = [];
      listDuck = [];

      let response = await fetch(
        "https://api.quackquack.games/nest/list-reload",
        {
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            authorization: "Bearer " + ACCESS_TOKEN,
          },
          body: null,
          method: "GET",
        }
      );
      let data = await response.json();
      if (data.error_code !== "") console.log(data.error_code);

      data.data.duck.map((item) => {
        listDuck.push(item);
      });

      data.data.nest.map((item) => {
        if (item.type_egg) listColect.push(item);
      });

      let eggs = listColect.map((i) => i.id);

      if (listColect.length > 0) {
        console.log(`Total Nest: ${listColect.length}`,eggs);
        collect();
      }
    } catch (error) {
      setTimeout(getListCollectEgg, 1e3);
    }
  }

  async function collect() {
    try {
      if (listColect.length === 0) return getTotalEgg();

      const egg = listColect[0];

      let response = await fetch("https://api.quackquack.games/nest/collect", {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,vi;q=0.8",
          authorization: "Bearer " + ACCESS_TOKEN,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: "nest_id=" + egg.id,
        method: "POST",
      });
      let data = await response.json();

      if (data.error_code !== "") console.log(data.error_code);

      const duck = getDuckToHarvest();
      HarvestEgg(egg, duck);
    } catch (error) {
      setTimeout(collect, 1e3);
    }
  }

  function getDuckToHarvest() {
    let duck = null;
    let now = Number((Date.now() / 1e3).toFixed(0));

    listDuck.forEach((duck) => {
      if (duck.last_active_time < now) now = duck.last_active_time;
    });
    listDuck.map((item) => {
      if (item.last_active_time === now) duck = item;
    });

    return duck;
  }

  async function HarvestEgg(egg, duck) {
    try {
      let response = await fetch("https://api.quackquack.games/nest/lay-egg", {
        headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
        authorization: "Bearer " + ACCESS_TOKEN,
        "content-type": "application/x-www-form-urlencoded",
        },
        body: "nest_id=" + egg.id + "&duck_id=" + duck.id,
        method: "POST",
      });
      let data = await response.json();
   
      if (data.error_code !== "") {
        console.log(data.error_code);
        const duck = getDuckToHarvest();
        HarvestEgg(egg, duck);
      } else {
        console.log(`   Collected 🥚 ${egg.id}`);
        listColect.shift();
        listDuck = listDuck.filter((d) => d.id !== duck.id);
        countEgg++;
        setTimeout(collect, 1e3);
      }
    } catch (error) {
      setTimeout(() => {
        HarvestEgg(egg, duck);
      }, 1e3);
    }
  }

  getGoldDuckInfo().then(getTotalEgg);

  setInterval(() => console.clear(), 3e5);

  async function getGoldDuckInfo() {
    try {
      let response = await fetch(
        "https://api.quackquack.games/golden-duck/info",
        {
          headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,vi;q=0.8",
          authorization: "Bearer " + ACCESS_TOKEN,
          },
          body: null,
          method: "GET",
        }
      );
      let data = await response.json();
  
      if (data.error_code !== "") console.log(data.error_code);

      console.log(``);
      if (data.data.time_to_golden_duck !== 0) {
        let nextGoldDuck = data.data.time_to_golden_duck;
        console.log(` ----------------------------------------`)
        console.log(`|  [GOLDEN DUCK] 🐥 ${Number((nextGoldDuck) / 60).toFixed(0)} minute remaining  |`);
        console.log(` ----------------------------------------`)
        console.log(``);
        setTimeout(getGoldDuckInfo, 60000);
      } else getGoldDuckReward();
    } catch (error) {
      setTimeout(getGoldDuckInfo, 1e3);
    }
  }

  async function getGoldDuckReward() {
    try {
      let response = await fetch(
        "https://api.quackquack.games/golden-duck/reward",
        {
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            authorization: "Bearer " + ACCESS_TOKEN,
          },
          body: null,
          method: "GET",
        }
      );
      let data = await response.json();
    
      if (data.error_code !== "") console.log(data.error_code);

      if (data.data.type === 0) {
        console.log(`🐙 Good Luck !!!`);
        getGoldDuckInfo();
      }

      if (data.data.type === 2 || data.data.type === 3) claimGoldDuck(data.data);
    } catch (error) {
      setTimeout(getGoldDuckReward, 1e3);
    }
  }

  function infoGoldDuck(data) {
    if (data.type === 1) return { label: "TON 💎", amount: data.amount };
    if (data.type === 2) return { label: "Pepe 🐸", amount: data.amount };
    if (data.type === 3) return { label: "Egg 🥚", amount: data.amount };
    if (data.type === 4) return { label: "TRU", amount: data.amount };
  }

  async function claimGoldDuck(gDuck) {
    try {
      let response = await fetch(
        "https://api.quackquack.games/golden-duck/claim",
        {
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            authorization: "Bearer " + ACCESS_TOKEN,
            "content-type": "application/x-www-form-urlencoded",
          },
          body: "type=1",
          method: "POST",
        }
      );
      let data = await response.json();

      if (data.error_code !== "") console.log(data.error_code);

      let info = infoGoldDuck(gDuck);

      if (info.label === "Egg 🥚") countEgg += Number(info.amount);

      console.log(`   ✨✨✨[GOLDEN DUCK] 🐥 Claim ${Number(info.amount)} ${info.label}`);
      console.log();

      getGoldDuckInfo();
    } catch (error) {
      setTimeout(claimGoldDuck, 1e3);
    }
  }
  rl.close();
});
