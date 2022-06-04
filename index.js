const puppeteer = require("puppeteer");
const csv = require("csv-parser");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "hcm_hotels.csv",
  header: [
    { id: "id", title: "#" },
    { id: "name", title: "Name" },
    { id: "link", title: "Link" },
  ],
});

(async () => {
  const baseUrl =
    "https://www.booking.com/searchresults.vi.html?aid=1610725&label=ho-chi-minh-city-5%2A3auhMEhRGSd7HA9DCi_wS349923294895%3Apl%3Ata%3Ap1%3Ap2%3Aac%3Aap%3Aneg%3Afi%3Atikwd-308534867725%3Alp9074054%3Ali%3Adec%3Adm%3Appccp%3DUmFuZG9tSVYkc2RlIyh9YUBh8MufZgNFlM8CT-9cdjM&sid=a2acaca5d119e33a81c289e7da1de9c8&dest_id=-3730078&dest_type=city&order=bayesian_review_score&";
  const urls = [baseUrl];
  const data = [];
  var i = 1;

  for (j = 1; j < 40; j++) {
    urls.push(baseUrl + "offset=" + j * 25);
  }

  const browser = await puppeteer.launch();

  for (j = 0; j < urls.length; j++) {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    );
    await page.goto(urls[j]);

    try {
      await page.waitForSelector("#search_results_table", { visible: true });

      const hotels = await page.evaluate((i) => {
        const d = [];
        const pms = document.querySelectorAll("#search_results_table h3 > a");

        pms.forEach((element) => {
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
      }, i);
      data.push(...hotels);
      i += 25;
      page.close();
    } catch (e) {
      console.log(e);
    }
  }

  csvWriter
    .writeRecords(data)
    .then(() => console.log("The CSV file was written successfully"));

  // other actions...
  await browser.close();
})();
