const puppeteer = require("puppeteer");
const csv = require("csv-parser");
const fs = require("fs");

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "hcm_hotels_comments.csv",
  header: [
    { id: "id", title: "#" },
    { id: "name", title: "Name" },
    { id: "nationality", title: "Nationality" },
    { id: "roomType", title: "Room Type" },
    { id: "los", title: "LOS" },
    { id: "travellerType", title: "Traveller Type" },
    { id: "generalReview", title: "General Review" },
    { id: "reviewScore", title: "Review Score" },
    { id: "reviewDate", title: "Review Date" },
    { id: "likeReview", title: "Like Review" },
    { id: "dislikeReview", title: "Dislike Review" },
  ],
});

const readCsv = async () => {
  const urls = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream("hcm_hotels.csv")
      .pipe(csv())
      .on("data", (row) => {
        urls.push(row.Link + "#tab-reviews");
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
      await page.waitForSelector("#review_list_page_container", {
        visible: true,
      });

      const hotel = await page.evaluate((i) => {
        const container = document.querySelectorAll(
          "#review_list_page_container .review_list > li"
        );

        container.forEach((reviewer) => {
          const name = reviewer.querySelector(
            ".bui-avatar-block__title"
          ).textContent;
          const nationality = reviewer
            .querySelector(".bui-avatar-block__subtitle")
            .textContent.match(/\n+ +\n+ +(.+)/)[1];
          const roomType = reviewer
            .querySelector(".c-review-block__room-link .bui-list__body")
            .textContent.match(/\n+(.+)\n+/)[1];
          const los = reviewer
            .querySelector(
              "ul.c-review-block__stay-date li:first-child .bui-list__body"
            )
            .textContent.match(/\n(.+)\n\n.+\n\n/)[1]
            .replace(" · ", "");
          const travellerType = reviewer
            .querySelector(".review-panel-wide__traveller_type")
            .textContent.match(/\n+(.+)\n+/)[1];
          const generalReview = reviewer
            .querySelector("h3")
            .textContent.match(/\n+(.+)\n+/)[1];
          const score = reviewer
            .querySelector(".bui-review-score__badge")
            .textContent.replaceAll(" ", "");
          const date = reviewer
            .querySelector(".c-review-block__row > .c-review-block__date")
            .textContent.match(/\nĐã đánh giá: (.+)\n/)[1];

          const reviews = reviewer.querySelectorAll(".c-review .c-review__row");
          let likeReview = "";
          let dislikeReview = "";
          if (reviews.length === 2) {
            likeReview =
              reviews[0].querySelector(".c-review__body").textContent;
            dislikeReview =
              reviews[1].querySelector(".c-review__body").textContent;
          } else {
            const comment =
              reviews[0].querySelector(".c-review__body").textContent;
            if (reviews[0].className.includes("lalala")) {
              dislikeReview = comment;
            } else {
              likeReview = comment;
            }
          }
        });

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
