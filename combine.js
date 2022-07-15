const puppeteer = require("puppeteer");
const csv = require("csv-parser");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "hcm_hotels_final.csv",
  header: [
    { id: "id", title: "#" },
    { id: "name", title: "Name" },
    { id: "type", title: "Type" },
    { id: "stars", title: "Stars" },
    { id: "score", title: "Score" },
    { id: "address", title: "Address" },
    { id: "detailScores", title: "DetailScores" },
    { id: "comments", title: "Comments" },
    { id: "id2", title: "#2" },
    { id: "reviewerName", title: "Reviewer Name" },
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

const readCsvComments = async () => {
  const urls = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream("hcm_hotels_comments_final.csv")
      .pipe(csv())
      .on("data", (row) => {
        urls.push({
          id2: row["#"],
          hotelId: row.Id,
          reviewerName: row.Name,
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
      })
      .on("end", () => {
        console.log("CSV file successfully processed");
        resolve(urls);
      })
      .on("error", reject);
  });
};

const readCsvDetails = async () => {
  const urls = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream("hcm_hotels_details.csv")
      .pipe(csv())
      .on("data", (row) => {
        urls.push({
          id: row["#"],
          name: row.Name,
          type: row.Type,
          stars: row.Stars,
          score: row.Score,
          address: row.Address,
          detailScores: row.DetailScores,
          comments: row.Comments,
        });
      })
      .on("end", () => {
        console.log("CSV file successfully processed");
        resolve(urls);
      })
      .on("error", reject);
  });
};

(async () => {
  const details = await readCsvDetails();
  const comments = await readCsvComments();
  const data = [];
  var j = 0;

  for (i = 0; i < details.length; i++) {
    // console.log(details[i].id);
    // console.log(comments[j].id2);
    if (j < comments.length && details[i].id == comments[j].hotelId) {
      do {
        data.push({
          id: details[i].id,
          name: details[i].name,
          type: details[i].type,
          stars: details[i].stars,
          score: details[i].score,
          address: details[i].address,
          detailScores: details[i].detailScores,
          comments: details[i].comments,
          id2: comments[j].id2,
          reviewerName: comments[j].reviewerName,
          nationality: comments[j].nationality,
          roomType: comments[j].roomType,
          los: comments[j].los,
          travellerType: comments[j].travellerType,
          generalReview: comments[j].generalReview,
          reviewScore: comments[j].reviewScore,
          reviewDate: comments[j].reviewDate,
          photo: comments[j].photo,
          likeReviewReview: comments[j].likeReview,
          dislikeReview: comments[j].dislikeReview,
        });
        j++;
      } while (j < comments.length && details[i].id == comments[j].hotelId);
    } else {
      data.push({
        id: details[i].id,
        name: details[i].name,
        type: details[i].type,
        stars: details[i].stars,
        score: details[i].score,
        address: details[i].address,
        detailScores: details[i].detailScores,
        comments: details[i].comments,
        id2: "",
        reviewerName: "",
        nationality: "",
        roomType: "",
        los: "",
        travellerType: "",
        generalReview: "",
        reviewScore: "",
        reviewDate: "",
        photo: "",
        likeReviewReview: "",
        dislikeReview: "",
      });
    }
  }
  console.log(1);
  csvWriter
    .writeRecords(data)
    .then(() => console.log("The CSV file was written successfully"));
})();
