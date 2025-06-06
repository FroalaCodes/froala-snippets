var myHeaders = new Headers();
myHeaders.append("X-API-KEY", "b2430***************************19be00"); // Replace with your actual API key
myHeaders.append("Content-Type", "application/json");

var requestOptions = {
  method: "GET",
  redirect: "follow",
  headers: myHeaders,
};

fetch("https://api.translateplus.io/v1/supported-languages", requestOptions)
  .then((response) => response.json())
  .then((result) => initFroala(result.supported_languages))
  .catch((error) => console.log("error", error));