/**
 * sendResponse — Sends a standardised JSON response.
 *
 * Usage:
 *   sendResponse(res, 200, "success", "users", users, users.length, "Users fetched successfully")
 *   sendResponse(res, 201, "success", "user", newUser)
 *
 *   -- Please dont use the below for sending errors it must be done using global error middleWare
 *   -- only below is just to know that when there is no data please pass null
 *   -- and undefined for results and messages
 * 
 *     ->  sendResponse(res, 500, "err", null, null, undefined, "This route has not been implemented yet!!")
 *
 */

const sendResponse = (res, statusCode, status, dataName, dataValue, results, message) => {
  const response = { status };

  if (message) response.message = message;
  if (results !== undefined) response.results = results;

  response.data = dataName ? { [dataName]: dataValue } : null;

  return res.status(statusCode).json(response);
};

export { sendResponse };
