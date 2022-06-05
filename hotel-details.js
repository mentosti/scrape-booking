const puppeteer = require("puppeteer");
const csv = require("csv-parser");
const fs = require("fs");

const readCsv = async () => {
  const urls = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream("hcm_hotels.csv")
      .pipe(csv())
      .on("data", (row) => {
        urls.push(row.Link);
      })
      .on("end", () => {
        console.log("CSV file successfully processed");
        resolve(urls);
      })
      .on("error", reject);
  });
};

(async () => {
  const urls = await readCsv();
  const data = [];

  const browser = await puppeteer.launch();

  for (i = 1; i <= urls.length; i++) {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    );
    await page.goto(urls[j]);

    try {
      await page.waitForSelector("#wrap-hotelpage-top", { visible: true });

      const hotels = await page.evaluate(() => {
        const d = [];
        const container = document.querySelector("#wrap-hotelpage-top");
        const address = container.querySelector(
          "#showMap2 .hp_address_subtitle"
        ).innerHTML;
        let pattern = /\n\n(.+)\n\n(.+)\n/;
        const hotelInfo = container
          .querySelector("#hp_hotel_name")
          .textContent.match(pattern);
        const hotelName = hotelInfo[2];
        const hotelType = hotelInfo[1];
        const hotelStars = container.querySelectorAll(
          'span[data-testid="rating-stars"] span'
        ).length;

        container.forEach((element) => {
          const hotelName = element.querySelector(
            ":scope > div:nth-child(1)"
          ).innerHTML;
          d.push({
            id: i++,
            name: hotelName,
            link: element.getAttribute("href"),
          });
        });

        return d;
      });
      data.push(...hotels);
      i += 25;
      page.close();
    } catch (e) {
      console.log(e);
    }
  }

  // csvWriter
  //   .writeRecords(data)
  //   .then(() => console.log("The CSV file was written successfully"));

  // // other actions...
  // await browser.close();
})();
