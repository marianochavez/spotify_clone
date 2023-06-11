import { Price } from "@/types";

/**
 * Returns the URL of the site based on the environment variables set.
 *
 * @return {string} The URL of the site.
 */
export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000/";
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to including trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

/**
 * Asynchronously sends data to a specified URL using HTTP POST method with JSON formatted data.
 *
 * @param {Object} param - An object containing the URL and optional data to be sent.
 * @param {string} param.url - The URL to which the data is to be sent.
 * @param {Object} [param.data] - An optional object with a 'price' field whose value is an object of type Price.
 * @return {Promise} A promise that resolves with the JSON parsed response from the server.
 * @throws {Error} If the response from the server is not successful.
 */
export const postData = async ({
  url,
  data,
}: {
  url: string;
  data?: { price: Price };
}) => {
  console.log("posting,", url, data);

  const res: Response = await fetch(url, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    credentials: "same-origin",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    console.log("Error in postData", { url, data, res });

    throw Error(res.statusText);
  }

  return res.json();
};

/**
 * Converts a Unix timestamp to a Date object.
 *
 * @param {number} secs - The number of seconds since Unix epoch start.
 * @return {Date} A Date object representing the timestamp.
 */
export const toDateTime = (secs: number) => {
  var t = new Date("1970-01-01T00:30:00Z"); // Unix epoch start.
  t.setSeconds(secs);
  return t;
};
