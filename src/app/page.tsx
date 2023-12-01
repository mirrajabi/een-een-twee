"use client";

import { ReportDetails, getAllReportsWithDetails } from "@/data/reports";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import iconFire from "../../res/fire.png";
import iconAmbulance from "../../res/medical-emergency.png";
import iconPolice from "../../res/police-badge.png";
import { StaticImageData } from "next/image";

const CENTER: [number, number] = process.env.NEXT_PUBLIC_CENTER!.split(",").map((x) => parseFloat(x)) as [number, number];

export default function Home() {
  const [map, setMap] = useState<mapboxgl.Map>();
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const newMap = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/dark-v11",
      center: CENTER,
      zoom: 11.5,
    });

    newMap.on("load", () => setupMap(newMap));
    setMap(newMap);
  }, []);

  const query = useQuery({
    queryKey: ["reports"],
    queryFn: getAllReportsWithDetails,
    refetchInterval: 20000,
    staleTime: 10000,
  });

  useEffect(() => {
    if (!map || !query.data) {
      console.log(query.data);
      return;
    }

    updateMap(map, query.data);
  }, [map, query.data]);

  return (
    <main>
      <div id="map" style={{ width: "100%", height: "100vh" }} />
    </main>
  );
}

const loadImage = (
  map: mapboxgl.Map,
  id: string,
  imageData: StaticImageData
) => {
  if (map.hasImage(id)) {
    map.removeImage(id);
  }
  const image = new Image();
  image.src = imageData.src;
  image.onload = () => map.addImage(id, image);
};

const setupMap = (map: mapboxgl.Map) => {
  loadImage(map, "fire", iconFire);
  loadImage(map, "ambulance", iconAmbulance);
  loadImage(map, "police", iconPolice);

  map.addSource("reports", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });
  map.addLayer({
    id: "reports",
    type: "symbol",
    source: "reports",
    layout: {
      "icon-allow-overlap": true,
      "icon-pitch-alignment": "map",
      "icon-rotation-alignment": "map",
      "icon-size": [
        "case",
        ["==", ["get", "type"], "fire"],
        0.3,
        ["==", ["get", "type"], "ambulance"],
        0.12,
        ["==", ["get", "type"], "police"],
        0.3,
        1,
      ],
      "icon-image": [
        "case",
        ["==", ["get", "type"], "fire"],
        "fire",
        ["==", ["get", "type"], "ambulance"],
        "ambulance",
        ["==", ["get", "type"], "police"],
        "police",
        "unknown",
      ],
    },
  });
};

const updateMap = (map: mapboxgl.Map, reports: ReportDetails[]) => {
  console.log("updateMap");
  console.log(reports);
  const source = map.getSource("reports") as mapboxgl.GeoJSONSource;
  if (source === undefined) {
    return;
  }

  source.setData({
    type: "FeatureCollection",
    features: reports.map((report) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [report.location[1], report.location[0]],
      },
      properties: {
        type: report.type,
      },
    })),
  });
};