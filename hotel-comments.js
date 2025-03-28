const puppeteer = require("puppeteer");
const csv = require("csv-parser");
const fs = require("fs");

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "hcm_hotels_comments.csv",
  header: [
    { id: "id", title: "#" },
    { id: "hotelId", title: "Id" },
    { id: "name", title: "Name" },
    { id: "nationality", title: "Nationality" },
    { id: "roomType", title: "Room Type" },
    { id: "los", title: "LOS" },
    { id: "travellerType", title: "Traveller Type" },
    { id: "generalReview", title: "General Review" },
    { id: "reviewScore", title: "Review Score" },
    { id: "reviewDate", title: "Review Date" },
    { id: "photo", title: "Photo" },
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

const getComments = async (i, j, page) => {
  return page.evaluate(
    (i, j) => {
      const container = document.querySelectorAll(
        "#reviewCardsSection > div[data-testid='review-cards'] > div > div[data-testid='review-card']"
      );

      var comments = [];

      container.forEach((reviewer) => {
        const name = reviewer.querySelector(
          "div[data-testid='review-avatar'] > div > div:nth-child(2) > div:first-child"
        ).textContent;

        const nationalityElement = reviewer.querySelector(
          "div[data-testid='review-avatar'] > div > div:nth-child(2) > div:nth-child(2) > span"
        );
        const nationality = nationalityElement
          ? nationalityElement.textContent.trim()
          : "";

        const roomTypeElement = reviewer.querySelector(
          "span[data-testid='review-room-name']"
        );
        const roomType = roomTypeElement
          ? roomTypeElement.textContent.trim()
          : "";

        const losElement = reviewer.querySelector(
          "span[data-testid='review-num-nights']"
        );
        const los = losElement
          ? losElement.textContent.trim().replace(" ·", "")
          : "";

        const travellerTypeElement = reviewer.querySelector(
          "span[data-testid='review-traveler-type']"
        );
        const travellerType = travellerTypeElement
          ? travellerTypeElement.textContent.trim()
          : "";

        const generalReviewElement = reviewer.querySelector(
          "h4[data-testid='review-title']"
        );
        const generalReview = generalReviewElement
          ? generalReviewElement.textContent.trim()
          : "";

        const scoreElement = reviewer.querySelector(
          "div[data-testid='review-score']"
        );
        const score = scoreElement
          ? scoreElement.textContent.textContent.match(/\d+\.\d+/g)[1]
          : "";

        const dateElement = reviewer.querySelector(
          "span[data-testid='review-date']"
        );
        const date = dateElement ? dateElement.textContent.trim() : "";

        const photo =
          reviewer.querySelector(
            "picture[data-testid='REVIEW_THUMBNAIL_PROPERTY']"
          ) == null
            ? "No"
            : "Yes";

        const reviews = reviewer.querySelectorAll(".c-review .c-review__row");

        let likeReview = "";
        let dislikeReview = "";

        if (
          (reviews.length === 2 &&
            reviews[1].querySelector("a.c-review__translation-link") == null) ||
          reviews.length === 3
        ) {
          likeReview = reviews[0]
            .querySelector(".c-review__body")
            .textContent.replaceAll("\n", " ");
          dislikeReview = reviews[1]
            .querySelector(".c-review__body")
            .textContent.replaceAll("\n", " ");
        } else {
          const comment = reviews[0]
            .querySelector(".c-review__body")
            .textContent.replaceAll("\n", ", ");
          if (reviews[0].className.includes("lalala")) {
            dislikeReview = comment;
          } else {
            likeReview = comment;
          }
        }

        comments.push({
          id: j++,
          hotelId: i,
          name,
          nationality,
          roomType,
          los,
          travellerType,
          generalReview,
          reviewScore: score,
          reviewDate: date,
          photo,
          likeReview,
          dislikeReview,
        });
      });

      return comments;
    },
    i,
    j
  );
};

(async () => {
  const urls = await readCsv();
  var j = 1;
  const browser = await puppeteer.launch();

  for (i = 350; i <= urls.length; i++) {
    const data = [];
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    );

    await page.goto(urls[i - 1]);
    var pageNumber = 1;
    do {
      console.log("Crawling hotel: " + i);
      console.log("Crawling comment page: " + pageNumber);
      try {
        await page.waitForSelector("#review_list_page_container", {
          visible: true,
        });

        const hotel = await getComments(i, j, page);
        data.push(...hotel);
        j += hotel.length;
        console.log("done Page: " + pageNumber++ + " !!!");

        const nextPageSelector =
          ".bui-pagination__item--active + .bui-pagination__item > a";

        const nextPage = await page.$(nextPageSelector);
        if (nextPage == null) {
          break;
        }
        await nextPage.evaluate((p) => {
          p.click();
        });
      } catch (e) {
        console.log(e);
        if (e.name == "TimeoutError") {
          break;
        }
      }
    } while (true);

    console.log("done hotel: " + i + " !!!");
    if (data.length > 0) {
      csvWriter
        .writeRecords(data)
        .then(() => console.log("The CSV file was written successfully"));
    }
    page.close();
  }

  // other actions...
  await browser.close();
})();
