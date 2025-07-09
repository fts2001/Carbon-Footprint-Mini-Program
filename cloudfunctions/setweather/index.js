// cloudfunctions/setWeather/index.js
// this function sets api and weather index
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init();

exports.main = async (event, context) => {
  const { latitude, longitude } = event;
  const geoApiKey = 'df35576dc85c4dd19641b86b91b48190';
  const geoApiUrl = 'https://geoapi.qweather.com/v2/city/lookup?key=' + geoApiKey + '&location=';
  const airApiUrl = 'https://devapi.qweather.com/v7/air/now?key=' + geoApiKey + '&location=';
  const weatherApiUrl = 'https://devapi.qweather.com/v7/weather/now?key=' + geoApiKey + '&location=';

  try {
    const geoApiFullUrl = geoApiUrl + longitude + ',' + latitude;

    const cityRes = await axios.get(geoApiFullUrl);
    const cityId = cityRes.data.location[0].id;
    const cityName = cityRes.data.location[0].adm2 + cityRes.data.location[0].name;
    const provinceName = cityRes.data.location[0].adm1;

    const airRes = await axios.get(airApiUrl + cityId);
    const airQuality = airRes.data.now.aqi;

    let newAqi = airQuality
    let newCategory =
      newAqi <= 50
        ? '优'
        : newAqi <= 100
        ? '良'
        : newAqi <= 150
        ? '轻度污染'
        : newAqi <= 200
        ? '中度污染'
        : newAqi <= 300
        ? '重度污染'
        : '严重污染';

    const weatherRes = await axios.get(weatherApiUrl + `${longitude},${latitude}`);
    const weather = weatherRes.data.now;

    return {
      provinceName: provinceName,
      cityName: cityName,
      aqi: airQuality,
      category: newCategory,
      weather,
      latitude,
      longitude,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};
