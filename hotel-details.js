const puppeteer = require("puppeteer");
const csv = require("csv-parser");
const fs = require("fs");

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "hcm_hotels_details.csv",
  header: [
    { id: "id", title: "#" },
    { id: "name", title: "Name" },
    { id: "type", title: "Type" },
    { id: "stars", title: "Stars" },
    { id: "score", title: "Score" },
    { id: "address", title: "Address" },
    { id: "detailScores", title: "DetailScores" },
    { id: "comments", title: "Comments" },
  ],
});

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
    console.log("Crawling hotel: " + i);
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    );

    await page.goto(urls[i - 1]);

    try {
      await page.waitForSelector("#wrap-hotelpage-top", { visible: true });

      const hotel = await page.evaluate((i) => {
        const container = document.querySelector("#wrap-hotelpage-top");
        let pattern = /\n(.+)\n/;
        const hotelAddress = container
          .querySelector("#showMap2 .hp_address_subtitle")
          .textContent.match(pattern)[1];
        pattern = /\n\n(.+)(\n\n\n\n.+\n)?\n\n(.+)\n/;
        const hotelInfo = container
          .querySelector("#hp_hotel_name")
          .textContent.match(pattern);
        const hotelName = hotelInfo.length == 3 ? hotelInfo[2] : hotelInfo[3];
        const hotelType = hotelInfo[1];
        const hotelStars = container.querySelectorAll(
          'span[data-testid="rating-stars"] span'
        ).length;
        const hotelScoreElement = document.querySelector(
          '.hp-review-score-cta-container-remote div[data-testid="review-score-component"] div:first-child'
        );
        const hotelScore = hotelScoreElement
          ? hotelScoreElement.textContent
          : "";
        const hotelDetailScoresElement = document.querySelectorAll(
          "#guest-featured_reviews__horizontal-block .review_list_score_container ul li"
        );
        let hotelDetailScores = "";
        hotelDetailScoresElement.forEach((score) => {
          hotelDetailScores +=
            score.querySelector(":scope > div > span:first-child").textContent +
            "- " +
            score.querySelector(":scope > div > span:nth-child(2)")
              .textContent +
            " | ";
        });
        hotelDetailScores = hotelDetailScores.substring(
          0,
          hotelDetailScores.lastIndexOf(" | ")
        );
        const hotelCommentsElement = document.querySelectorAll(
          '.hp-review-score-cta-container-remote div[data-testid="review-score-component"] div:last-child span'
        )[1];
        const hotelComments = hotelCommentsElement
          ? hotelCommentsElement.textContent
          : "";

        // hotelComments = hotelComments
        //   .replace(" · ", "")
        //   .replace(" đánh giá", "");

        return {
          id: i,
          name: hotelName,
          type: hotelType,
          stars: hotelStars,
          score: hotelScore,
          address: hotelAddress,
          detailScores: hotelDetailScores,
          comments: hotelComments,
        };
      }, i);
      data.push(hotel);
      console.log("done!!!");
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
