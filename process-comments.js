const puppeteer = require("puppeteer");
const csv = require("csv-parser");
const fs = require("fs");

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "hcm_hotels_comments_final.csv",
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
  var i = 1;
  return new Promise((resolve, reject) => {
    fs.createReadStream("hcm_hotels_comments.csv")
      .pipe(csv())
      .on("data", (row) => {
        if (row["#"]) {
          urls.push({
            id: i++,
            hotelId: row.Id,
            name: row.Name,
            nationality: row.Nationality,
            roomType: row["Room Type"],
            los: row.LOS,
            travellerType: row["Traverller Type"],
            generalReview: row["General Review"],
            reviewScore: row["Review Score"],
            reviewDate: row["Review Date"],
            photo: row.Photo,
            likeReview: row["Like Review"],
            dislikeReview: row["Dislike Review"],
          });
        }
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

  csvWriter
    .writeRecords(urls)
    .then(() => console.log("The CSV file was written successfully"));
})();
