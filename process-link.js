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

const readCsv = async () => {
  const urls = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream("hcm_hotels.csv")
      .pipe(csv())
      .on("data", (row) => {
        const id = row["#"];
        console.log("Process data: " + id);
        let pattern = /(.+\.html)/;
        const link = row.Link.match(pattern)[1];
        urls.push({
          id: id,
          name: row.Name,
          link: link,
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
  const urls = await readCsv();

  csvWriter
    .writeRecords(urls)
    .then(() => console.log("The CSV file was written successfully"));
})();
