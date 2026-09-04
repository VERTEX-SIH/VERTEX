**SIH26162 INTERACTIVE GUIDE** 



# **Data Ingestion & Preprocessing Resource Guide** 

All links and API endpoints are directly clickable / touchable on mobile and desktop PDF readers. 

## **1. Thermal Radiance & Hotspot Ingestion (NASA FIRMS)** 

#### **NASA FIRMS API Key Registration & Documentation** 

- `Portal: https://firms.modaps.eosdis.nasa.gov/api/` 

- `Key Generator: https://firms.modaps.eosdis.nasa.gov/api/map_key` Get a free 32-character MAP_KEY to query real-time thermal anomalies and historical fire archives. 

|**API Type / Endpoint**|**Instrument / Source**|**Format / Rate Limit**|**Primary Use Case**|
|---|---|---|---|
|/api/area/ (Bounding Box)|VIIRS_SNPP_NRT,<br>VIIRS_NOAA20_NRT,<br>MODIS_NRT|CSV / GeoJSON / KML (10 req/min,<br>5000 pts/req)|Real-time bounding box ingestion<br>around ROI / India boundary.|
|/api/country/ (Country Feed)|VIIRS_SNPP_NRT (375m<br>resolution)|Direct ISO-3 Country Stream (IND for<br>India)|National monitoring pipeline cron<br>jobs (runs every 3-6 hours).|
|FIRMS Archive Download|VIIRS (VNP14IMGTDL) &<br>MODIS (MCD14DL)|Shapefile, GeoPackage, Global Daily<br>CSVs|Historical baseline modeling (3-5<br>years) for persistent flare clustering.|



### **Key FIRMS Fields for Preprocessing** 

- <mark>`latitude` ,</mark> <mark>`longitude` :</mark> Hotspot centroid | • <mark>`bright_ti4`</mark> (K): 375m I4 band brightness temp (VIIRS) 

- <mark>`frp`</mark> (MW): Fire Radiative Power — primary metric for fire severity vs routine flare baseline 

- <mark>`confidence` :</mark> Detection quality (low/nominal/high) | • <mark>`daynight` :</mark> 'D' vs 'N' (Night acquisitions have higher SNR for industrial flares) 

## **2. Contextual & Infrastructure Data (OpenStreetMap & LULC)** 

#### **OpenStreetMap Overpass API** 

```
-
• Live Endpoint: https://overpassapi.de/api/interpreter
```

```
• Interactive Query GUI: https://overpass-turbo.eu/
```

Query industrial land-use boundaries, refinery tags, power plants, flare stacks, and forest reserves. 

### **Overpass QL: Industrial Sites** 

```
[out:json][timeout:30];
(
```

```
  way["landuse"="industrial"](bbox);
  relation["landuse"="industrial"](bbox);
  node["power"="plant"](bbox);
  way["power"="plant"](bbox);
  way["man_made"="works"](bbox);
  node["man_made"="flare"](bbox);
);
out body; >; out skel qt;
```

### **Overpass QL: Forest / Agriculture** 

```
[out:json][timeout:30];
```

```
(
  way["landuse"="farmland"](bbox);
  way["landuse"="farmyard"](bbox);
  way["landuse"="forest"](bbox);
  way["natural"="wood"](bbox);
  way["boundary"="national_park"](bbox);
);
out body; >; out skel qt;
```

|**Data Source**|**Direct Clickable Access URL**|**Preprocessing Use Case**|
|---|---|---|
|**Geofabrik OSM Extracts**|download.geofabrik.de/asia/india.html|Offline bulk<br>`.osm.pbf` ingestion into<br>PostGIS with<br>`osm2pgsql` .|
|**ESA WorldCover (10m LULC)**|esa-worldcover.org/en|10m global land cover raster for pixel-<br>wise validation (Crop vs Built vs Forest).|
|**Dynamic World (Google/WRI)**|dynamicworld.app (Via Earth Engine API)|Near real-time 10m LULC probability<br>distributions.|



Page 1 of 2 

SIH26162 Data Ingestion & Preprocessing Resource Guide 

## **3. High-Resolution Multispectral Satellite Data (Optical & SWIR)** 

#### **Microsoft Planetary Computer STAC API** 

- `STAC Catalog: https://planetarycomputer.microsoft.com/api/stac/v1` 

- `SDK Documentation: https://planetarycomputer.microsoft.com/docs/` 

Free access to Sentinel-2 L2A and Landsat 8/9 Cloud Optimized GeoTIFFs (COGs) with zero egress fees. 

#### **Copernicus Data Space Ecosystem (CDSE)** 

- `Web Portal: https://dataspace.copernicus.eu/` 

- `STAC / OData API: https://catalogue.dataspace.copernicus.eu/odata/v1/` Official ESA portal for full Sentinel-2 MSI data streams and Level-2A imagery. 

### **Key Spectral Bands & Spectral Index Calculations** 

|**Spectral Index / Band**|**Band Formula / Wavelength**|**Detection & Classification Objective**|
|---|---|---|
|**SWIR-2 / SWIR-1**|B12 (2190 nm) & B11 (1610 nm) [20m]|High-radiance thermal signatures, active combustion &<br>industrial flare cores.|
|**NBR (Normalized Burn Ratio)**|`(B8_NIR - B12_SWIR2) / (B8_NIR +`<br>`B12_SWIR2)`|Quantifies burn scars, structural devastation, and active<br>fire perimeters.|
|**NDVI (Vegetation Index)**|`(B8_NIR - B4_Red) / (B8_NIR + B4_Red)`|Distinguishes agricultural crop residue burning from<br>industrial structures.|
|**BAIS2 (Burned Area Index)**|`(1 - sqrt((B6*B7*B8A)/B4)) * ((B12-`<br>`B8A)/(sqrt(B12+B8A)+1))`|Optimized burned area detection post-disaster<br>validation.|



## **4. Core Python Preprocessing Stack & Pipeline Architecture** 

#### **Essential Geospatial Python Libraries** 

- <u>GeoPandas</u> & <u>Shapely: Spatial joins (</u> <mark>`sjoin`</mark> ) between FIRMS 

- points and OSM polygons. 

- <u>Rasterio</u> & <u>Xarray: Windowed reads of Sentinel-2 COG rasters for</u> 

- SWIR/RGB extraction. 

- <u>PySTAC Client: Querying satellite scenes by spatio-temporal</u> 

- bounds. 

- <u>DBSCAN / HDBSCAN: Spatio-temporal clustering to build the</u> 

- Persistent Source Heat Index. 

#### **Database & Backend Setup** 

- <u>PostgreSQL 16 + PostGIS 3.4: Spatial indexing with</u> <mark>`GIST`</mark> on 

- geometries. 

- <u>osm2pgsql: High-speed OSM PBF parser to relational PostGIS</u> 

- tables. 

- <u>Redis + Celery: Background workers polling FIRMS NRT endpoints</u> 

- every 30 mins. 

- <u>FastAPI: Async REST endpoints for dashboard visual layers.</u> 

Page 2 of 2 

SIH26162 Data Ingestion & Preprocessing Resource Guide 

