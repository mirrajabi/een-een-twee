import axios from "axios";
import * as cheerio from "cheerio";

type ReportType = "police" | "ambulance" | "fire";
const KNOWN_TYPES_NL = ["politie", "ambulance", "brandweer"];
const TYPES_NL_TO_EN: Record<string, ReportType> = {
  politie: "police",
  ambulance: "ambulance",
  brandweer: "fire",
};

export interface ReportListItem {
  url: string;
  title: string;
  date: string;
  type: ReportType;
}

export interface ReportDetails {
  id: string;
  title: string;
  description: string;
  date: string;
  location: [number, number];
  type: ReportType;
}

export const getAllReportsWithDetails = async (): Promise<ReportDetails[]> => {
  const reports = await getReports();
  const reportDetails = await Promise.all(
    reports.map(async (report) => await getReport(report.url))
  );
  return reportDetails;
};

export const getReports = async (): Promise<ReportListItem[]> => {
  const response = await axios.get(
    "http://localhost:3000/api/alarmeringen-proxy?proxyUrl=https://alarmeringen.nl/noord-holland/amsterdam-amstelland/"
  );

  return await parseReports(response.data);
};

export const getReport = async (url: string): Promise<ReportDetails> => {
  const response = await axios.get(
    `http://localhost:3000/api/alarmeringen-proxy?proxyUrl=https://alarmeringen.nl${url}`
  );

  return await parseReportDetails(response.data);
};

const parseReports = async (html: string): Promise<ReportListItem[]> => {
  const $ = cheerio.load(html);

  const titles = $("#all-messages")
    .find($(".report-list"))
    .find($(".msgtitle"))
    .find($("a"))
    .toArray()
    .map((el) => $(el).text().replace("\n", "").trim()!);

  const urls = $("#all-messages")
    .find($(".report-list"))
    .find($(".msgtitle"))
    .find($("a"))
    .toArray()
    .map((el) => $(el).attr("href")!);

  const dates = $("#all-messages")
    .find($(".report-list"))
    .find($(".date"))
    .toArray()
    .map((el) => $(el).text().replace("\n", "").trim()!);

  const types = $("#all-messages")
    .find($(".report-list"))
    .children($("div"))
    .filter(
      (i, el) => KNOWN_TYPES_NL.some((kt) => el.attribs.class.includes(kt))!
    )
    .toArray()
    .map(
      (el) =>
        TYPES_NL_TO_EN[
          KNOWN_TYPES_NL.find((kt) => el.attribs.class.includes(kt))!
        ]
    );

  const size = titles!.length;

  const reportItems: ReportListItem[] = [];
  for (let i = 0; i < size; i++) {
    const item: ReportListItem = {
      url: urls[i],
      title: titles[i],
      date: dates[i],
      type: types[i],
    };
    reportItems.push(item);
  }

  return reportItems;
};

const parseReportDetails = async (html: string): Promise<ReportDetails> => {
  const $ = cheerio.load(html);

  const pageUrl = $("meta[property='og:url']").attr("content");
  const pageUrlSplit = pageUrl!.split("/");
  const id = pageUrlSplit[pageUrlSplit.length - 2];

  const title = $("h1").text().replace("\n", "").trim()!;

  const mapUrl = $("#heatmap").children($("iframe")).attr("data-privacy-src")!;
  const parsedMapUrl = new URL(mapUrl);
  const parsedLocation = parsedMapUrl.searchParams!.get("q")!.split(",");
  let location: [number, number];
  if (
    Number.isNaN(Number(parsedLocation[0])) ||
    Number.isNaN(Number(parsedLocation[1]))
  ) {
    location = [0, 0];
  } else {
    location = parsedLocation.map((c) => Number(c.trim())) as [number, number];
  }

  const dateEl = $(".info-row").find($(".date")).toArray()[1];
  const date = $(dateEl).text().replace("\n", "").trim()!;

  const typeNL = $(".ads-details-wrapper")
    .find($(".text-right"))
    .find($("a"))
    .last()
    .text()
    .replace("\n", "")
    .trim()!
    .toLowerCase();
  const type = TYPES_NL_TO_EN[typeNL];

  return {
    id: id,
    title: title,
    date: date,
    description: "",
    location: location,
    type: type,
  };
};
