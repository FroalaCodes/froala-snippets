async function translate(text, translateTo) {
  // myHeaders should be defined globally or passed as an argument
  // Assuming 'myHeaders' is available from the get-languages.js script
  var requestOptions = {
    method: "POST",
    redirect: "follow",
    headers: myHeaders,
    body: JSON.stringify({
      text,
      source: "auto",
      target: translateTo,
    }),
  };

  try {
    const response = await fetch(
      "https://api.translateplus.io/v1/translate",
      requestOptions,
    );
    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Translation request failed:", error);
    return null; // Return null or some error indicator
  }
}